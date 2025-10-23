const Site = require('../models/Site');
const Task = require('../models/Task');
const Constant = require('../models/Constant');
const Shift = require('../models/Shift');
const Schedule = require('../models/Schedule');
const { calculateTaskDuration } = require('../utils/durationCalculator');

/**
 * Generate schedule grid based on sites, tasks, and delays
 * POST /api/schedule/generate
 */
exports.generateSchedule = async (req, res) => {
  try {
    const { gridHours = 24, delayedSlots = [] } = req.body;

    // 1. Fetch all required data
    const sites = await Site.find().sort({ isActive: -1, priority: 1 });
    const tasks = await Task.find().sort({ order: 1 });
    const constants = await Constant.getActiveConstants();
    const shifts = await Shift.find({ isActive: true }).sort({ startTime: 1 });

    if (sites.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No sites found. Please add sites before generating schedule.'
      });
    }

    if (tasks.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No tasks found. Please add tasks before generating schedule.'
      });
    }

    // 2. Calculate shift changeover delays and merge with user delays
    const shiftChangeoverDelays = calculateShiftChangeoverDelays(shifts, sites, gridHours);
    const allDelays = [...delayedSlots, ...shiftChangeoverDelays];

    // 3. Build delay map: site → Set of blocked hours
    const delayMap = {};
    allDelays.forEach(d => {
      const site = d.row || d.site;
      const hour = d.hour !== undefined ? d.hour : d.hourIndex;
      if (site && typeof hour === 'number' && hour >= 0 && hour < gridHours) {
        if (!delayMap[site]) delayMap[site] = new Set();
        delayMap[site].add(hour);
      }
    });

    // 4. Initialize data structures
    const grid = {};
    const hourlyAllocation = {};
    for (let h = 0; h < gridHours; h++) {
      hourlyAllocation[h] = {};
    }
    const lastFilledHour = {};
    const taskDurations = {};
    const sitePriority = {};
    const siteActive = {};
    const taskLimits = {};
    const taskColors = {};

    // 5. Build task lookups
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task.taskId] = task;
      taskLimits[task.taskId] = task.limits || 2;
      taskColors[task.taskId] = task.color || '#3498db';
    });

    // 6. Get default task (SEQ = 1 or first task)
    const defaultTask = tasks.find(t => t.order === 1) || tasks[0];
    const defaultTaskId = defaultTask ? defaultTask.taskId : 'DEFAULT';

    // 7. Process each site
    for (const site of sites) {
      const siteId = site.siteId;
      sitePriority[siteId] = site.priority;
      siteActive[siteId] = site.isActive;

      // Initialize grid row
      if (!grid[siteId]) {
        grid[siteId] = Array(gridHours).fill('');
        lastFilledHour[siteId] = 0;
      }

      // Skip inactive sites
      if (!site.isActive) continue;

      // Get current task or use default
      const currentTaskId = site.currentTask || defaultTaskId;

      // 8. Build task cycle based on firings
      const taskCycle = buildTaskCycle(currentTaskId, site.firings || 0, tasks);

      // 9. Track if we've used timeToComplete override
      let usedTimeToComplete = false;

      // 10. Allocate tasks in cycle
      for (const taskId of taskCycle) {
        const task = taskMap[taskId];
        if (!task) continue;

        let duration;

        // Use timeToComplete override for first occurrence of currentTask
        if (taskId === currentTaskId && !usedTimeToComplete && site.timeToComplete > 0) {
          duration = {
            minutes: site.timeToComplete * 60,
            hours: site.timeToComplete
          };
          usedTimeToComplete = true;
        } else {
          // Calculate duration based on UOM
          duration = calculateTaskDuration({
            uom: task.uom,
            totalPlanMeters: site.totalPlanMeters,
            totalBackfillTonnes: site.totalBackfillTonnes,
            remoteTonnes: site.remoteTonnes,
            rate: task.rate,
            taskDuration: task.taskDuration,
            constants: constants,
            siteWidth: site.width,
            siteHeight: site.height
          });
        }

        // Store duration data
        taskDurations[`${siteId}:${taskId}`] = duration;

        // Skip if 0 hours
        if (duration.hours === 0) continue;

        // Allocate hours
        allocateHours(
          siteId,
          taskId,
          duration.hours,
          task.limits || 2,
          delayMap,
          grid,
          hourlyAllocation,
          lastFilledHour,
          gridHours
        );
      }
    }

    // 11. Prepare schedule data
    console.log('=== DEBUG: Schedule Generation ===');
    console.log('hourlyAllocation keys:', Object.keys(hourlyAllocation));
    console.log('hourlyAllocation sample (hour 0-2):', {
      0: hourlyAllocation[0],
      1: hourlyAllocation[1],
      2: hourlyAllocation[2]
    });
    console.log('taskLimits:', taskLimits);
    console.log('taskColors:', taskColors);
    
    const scheduleData = {
      grid,
      hourlyAllocation,
      taskDurations,
      sitePriority,
      siteActive,
      taskColors,
      taskLimits,
      gridHours,
      shifts: shifts.map(s => ({
        shiftCode: s.shiftCode,
        shiftName: s.shiftName,
        startTime: s.startTime,
        endTime: s.endTime,
        color: s.color
      })),
      shiftChangeoverDelays: shiftChangeoverDelays,
      allDelays: allDelays
    };

    // 12. Save schedule to database
    const savedSchedule = await Schedule.create({
      gridHours,
      grid,
      hourlyAllocation,
      taskDurations,
      sitePriority,
      siteActive,
      taskColors,
      taskLimits,
      delayedSlots,
      allDelays,
      shiftChangeoverDelays,
      shifts: scheduleData.shifts,
      generatedBy: req.user._id,
      generatedAt: new Date()
    });

    // 13. Return schedule data with metadata
    res.json({
      status: 'success',
      data: {
        ...scheduleData,
        scheduleId: savedSchedule._id,
        generatedAt: savedSchedule.generatedAt,
        generatedBy: savedSchedule.generatedBy
      }
    });

  } catch (error) {
    console.error('Generate schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
};

/**
 * Build task cycle based on firings
 * @param {string} currentTaskId - Starting task ID
 * @param {number} firings - Number of blast cycles
 * @param {Array} allTasks - All tasks sorted by order
 * @returns {Array} - Array of task IDs in cycle order
 */
function buildTaskCycle(currentTaskId, firings, allTasks) {
  const cycles = Math.max(1, firings || 1);
  
  // Find index of current task
  const currentIndex = allTasks.findIndex(t => t.taskId === currentTaskId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;

  const cycle = [];

  if (cycles === 1) {
    // No wrap-around: Start from current task, go to end
    for (let i = startIndex; i < allTasks.length; i++) {
      cycle.push(allTasks[i].taskId);
    }
  } else {
    // Multiple firings: Complete full cycle, then repeat
    const fullCycle = [];
    for (let i = 0; i < allTasks.length; i++) {
      const index = (startIndex + i) % allTasks.length;
      fullCycle.push(allTasks[index].taskId);
    }
    // Repeat full cycle 'cycles' times
    for (let c = 0; c < cycles; c++) {
      cycle.push(...fullCycle);
    }
  }

  return cycle;
}

/**
 * Calculate shift changeover delays for all sites
 * 
 * This function automatically generates delay entries for shift changeover periods.
 * The changeover delay is applied BEFORE each shift starts, using the 
 * shiftChangeDuration field from the Shift model (stored in minutes).
 * 
 * Example:
 * - Shift A starts at 06:00 with 30-minute changeover
 * - Delay will block hour 5 (05:00-06:00)
 * - This prevents task allocation during the changeover period
 * 
 * @param {Array} shifts - All active shifts from database
 * @param {Array} sites - All sites (only active sites get delays)
 * @param {number} gridHours - Total grid hours (24 or 48)
 * @returns {Array} - Array of delay objects for shift changeovers
 */
function calculateShiftChangeoverDelays(shifts, sites, gridHours) {
  const delays = [];

  if (!shifts || shifts.length === 0) return delays;

  // Calculate changeover hours based on shift start times
  const changeoverHoursMap = new Map(); // Map hour -> shift info
  
  shifts.forEach(shift => {
    // Parse start time (format: "HH:MM")
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    
    // Get changeover duration from shift settings (in minutes)
    const durationMinutes = shift.shiftChangeDuration || 30;
    const durationHours = Math.ceil(durationMinutes / 60);
    
    // Calculate changeover period ENDING at shift start time
    // Example: If shift starts at 6:00 and changeover is 30 min,
    // delay should be from 5:30 to 6:00, which covers hour 5
    for (let i = 0; i < durationHours; i++) {
      const changeoverHourIn24 = (startHours - durationHours + i + 24) % 24;
      
      // For 48-hour grids, add delays for both day 1 and day 2
      const daysToGenerate = gridHours <= 24 ? 1 : Math.ceil(gridHours / 24);
      
      for (let day = 0; day < daysToGenerate; day++) {
        const changeoverHour = changeoverHourIn24 + (day * 24);
        
        // Only add if within grid range
        if (changeoverHour < gridHours) {
          if (!changeoverHoursMap.has(changeoverHour)) {
            changeoverHoursMap.set(changeoverHour, {
              shiftName: shift.shiftName,
              shiftCode: shift.shiftCode,
              durationMinutes: durationMinutes
            });
          }
        }
      }
    }
  });

  // Create delay entries for each site at each changeover hour
  sites.forEach(site => {
    if (!site.isActive) return; // Skip inactive sites
    
    changeoverHoursMap.forEach((shiftInfo, hour) => {
      delays.push({
        row: site.siteId,
        site: site.siteId,
        hourIndex: hour,
        hour: hour,
        category: 'Operational',
        code: 'SHIFT_CHANGE',
        comments: `Shift changeover for ${shiftInfo.shiftCode} (${shiftInfo.durationMinutes} min)`,
        duration: 1,
        isAutomatic: true,
        shiftCode: shiftInfo.shiftCode
      });
    });
  });

  return delays;
}

/**
 * Allocate hours for a task
 * @param {string} siteId - Site ID
 * @param {string} taskId - Task ID
 * @param {number} hoursNeeded - Hours to allocate
 * @param {number} taskLimit - Max sites per hour for this task
 * @param {Object} delayMap - Map of delayed hours per site
 * @param {Object} grid - Grid data structure
 * @param {Object} hourlyAllocation - Hourly allocation tracker
 * @param {Object} lastFilledHour - Last filled hour per site
 * @param {number} gridHours - Total grid hours
 */
function allocateHours(
  siteId,
  taskId,
  hoursNeeded,
  taskLimit,
  delayMap,
  grid,
  hourlyAllocation,
  lastFilledHour,
  gridHours
) {
  let remaining = hoursNeeded;
  let currentHour = lastFilledHour[siteId];

  while (remaining > 0 && currentHour < gridHours) {
    // Check if hour is delayed for this site
    if (delayMap[siteId] && delayMap[siteId].has(currentHour)) {
      currentHour++;
      continue;
    }

    // Check if cell is already filled
    if (grid[siteId][currentHour]) {
      currentHour++;
      continue;
    }

    // Check hourly limit for this task
    const currentUsage = hourlyAllocation[currentHour][taskId] || 0;
    if (currentUsage >= taskLimit) {
      currentHour++;
      continue;
    }

    // Allocate this hour
    grid[siteId][currentHour] = taskId;
    hourlyAllocation[currentHour][taskId] = currentUsage + 1;
    remaining--;
    currentHour++;
  }

  lastFilledHour[siteId] = currentHour;
}

/**
 * Get the latest generated schedule
 * GET /api/schedule/latest
 */
exports.getLatestSchedule = async (req, res) => {
  try {
    // Find the most recent schedule
    const latestSchedule = await Schedule.findOne()
      .sort({ generatedAt: -1 })
      .populate('generatedBy', 'name email')
      .lean();

    if (!latestSchedule) {
      return res.status(404).json({
        status: 'error',
        message: 'No schedule found. Please generate a schedule first.'
      });
    }

    console.log('=== DEBUG: Get Latest Schedule ===');
    console.log('Schedule ID:', latestSchedule._id);
    console.log('hourlyAllocation type:', typeof latestSchedule.hourlyAllocation);
    console.log('hourlyAllocation keys:', Object.keys(latestSchedule.hourlyAllocation || {}));
    console.log('hourlyAllocation sample:', {
      0: latestSchedule.hourlyAllocation?.[0],
      1: latestSchedule.hourlyAllocation?.[1],
      2: latestSchedule.hourlyAllocation?.[2]
    });

    res.json({
      status: 'success',
      data: latestSchedule
    });

  } catch (error) {
    console.error('Get latest schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch latest schedule',
      error: error.message
    });
  }
};

/**
 * Get schedule history
 * GET /api/schedule/history
 */
exports.getScheduleHistory = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const schedules = await Schedule.find()
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('generatedBy', 'name email')
      .select('_id generatedAt gridHours generatedBy')
      .lean();

    const total = await Schedule.countDocuments();

    res.json({
      status: 'success',
      data: {
        schedules,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get schedule history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch schedule history',
      error: error.message
    });
  }
};

/**
 * Toggle site active status
 * PUT /api/schedule/sites/:siteId/toggle
 */
exports.toggleSiteStatus = async (req, res) => {
  try {
    const { siteId } = req.params;

    const site = await Site.findOne({ siteId: siteId.toUpperCase() });
    if (!site) {
      return res.status(404).json({
        status: 'error',
        message: 'Site not found'
      });
    }

    site.isActive = !site.isActive;
    await site.save();

    res.json({
      status: 'success',
      data: {
        site: {
          siteId: site.siteId,
          isActive: site.isActive
        }
      }
    });

  } catch (error) {
    console.error('Toggle site status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle site status',
      error: error.message
    });
  }
};

/**
 * Export schedule to Excel
 * GET /api/schedule/export/:scheduleId
 */
exports.exportScheduleToExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { scheduleId } = req.params;

    // Fetch schedule data
    let schedule;
    if (scheduleId === 'latest') {
      schedule = await Schedule.findOne()
        .sort({ generatedAt: -1 })
        .lean();
    } else {
      schedule = await Schedule.findById(scheduleId).lean();
    }

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Schedule not found'
      });
    }

    // Helper function to convert hex color to Excel RGB
    const hexToRGB = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        rgb: (parseInt(result[1], 16)).toString(16).padStart(2, '0').toUpperCase() +
             (parseInt(result[2], 16)).toString(16).padStart(2, '0').toUpperCase() +
             (parseInt(result[3], 16)).toString(16).padStart(2, '0').toUpperCase()
      } : { rgb: 'FFFFFF' };
    };

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Prepare schedule grid data
    const { grid, taskColors, sitePriority, siteActive, gridHours, allDelays, shiftChangeoverDelays } = schedule;
    
    // Build delay map for marking delayed cells
    const delayMap = {};
    const shiftDelayMap = {};
    
    if (allDelays && Array.isArray(allDelays)) {
      allDelays.forEach(d => {
        const site = d.row || d.site;
        const hour = d.hour !== undefined ? d.hour : d.hourIndex;
        if (site && typeof hour === 'number') {
          if (!delayMap[site]) delayMap[site] = {};
          delayMap[site][hour] = {
            category: d.category || d.delayCategory || '',
            code: d.code || d.delayCode || '',
            comments: d.comments || d.notes || '',
            isAutomatic: d.isAutomatic || false
          };
        }
      });
    }
    
    if (shiftChangeoverDelays && Array.isArray(shiftChangeoverDelays)) {
      shiftChangeoverDelays.forEach(d => {
        const site = d.row || d.site;
        const hour = d.hour !== undefined ? d.hour : d.hourIndex;
        if (site && typeof hour === 'number') {
          if (!shiftDelayMap[site]) shiftDelayMap[site] = {};
          shiftDelayMap[site][hour] = {
            shiftCode: d.shiftCode || '',
            comments: d.comments || ''
          };
        }
      });
    }
    
    // Get all sites sorted by priority
    const sites = Object.keys(grid).sort((a, b) => {
      const activeA = siteActive[a] ? 0 : 1;
      const activeB = siteActive[b] ? 0 : 1;
      if (activeA !== activeB) return activeA - activeB;
      return (sitePriority[a] || 999) - (sitePriority[b] || 999);
    });

    // Build schedule sheet
    const scheduleData = [];
    
    // Header row
    const headerRow = ['Priority', 'Site', 'Status'];
    for (let h = 0; h < gridHours; h++) {
      headerRow.push(`Hour ${h + 1}`);
    }
    scheduleData.push(headerRow);

    // Data rows
    sites.forEach(site => {
      const row = [
        sitePriority[site] || '',
        site,
        siteActive[site] ? 'Active' : 'Inactive'
      ];
      
      for (let h = 0; h < gridHours; h++) {
        const taskId = grid[site][h] || '';
        const delay = delayMap[site] && delayMap[site][h];
        const shiftDelay = shiftDelayMap[site] && shiftDelayMap[site][h];
        
        // Show task, or delay marker if delayed
        if (shiftDelay) {
          row.push(`[SHIFT: ${shiftDelay.shiftCode}]`);
        } else if (delay && delay.isAutomatic) {
          row.push(`[AUTO DELAY]`);
        } else if (delay) {
          row.push(`[DELAY: ${delay.code}]`);
        } else {
          row.push(taskId);
        }
      }
      
      scheduleData.push(row);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(scheduleData);

    // Apply cell styles (colors and formatting)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddr]) continue;
      worksheet[cellAddr].s = {
        fill: { fgColor: { rgb: '0F0E17' } },
        font: { color: { rgb: 'FF8906' }, bold: true },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Style data cells with colors
    sites.forEach((site, siteIdx) => {
      const rowIdx = siteIdx + 1; // +1 for header row
      
      // Style priority, site, status columns
      for (let col = 0; col < 3; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: col });
        if (!worksheet[cellAddr]) continue;
        worksheet[cellAddr].s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          font: { bold: col === 1 } // Bold site name
        };
        
        // Gray out inactive sites
        if (!siteActive[site]) {
          worksheet[cellAddr].s.fill = { fgColor: { rgb: 'D3D3D3' } };
          worksheet[cellAddr].s.font.color = { rgb: '666666' };
        }
      }
      
      // Style hour columns with task colors
      for (let h = 0; h < gridHours; h++) {
        const col = h + 3; // +3 for Priority, Site, Status columns
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: col });
        if (!worksheet[cellAddr]) continue;
        
        const taskId = grid[site][h];
        const delay = delayMap[site] && delayMap[site][h];
        const shiftDelay = shiftDelayMap[site] && shiftDelayMap[site][h];
        
        let cellStyle = {
          alignment: { horizontal: 'center', vertical: 'center' }
        };
        
        // Apply colors based on cell content
        if (shiftDelay) {
          // Shift changeover - Orange background
          cellStyle.fill = { fgColor: { rgb: 'FFA500' } };
          cellStyle.font = { color: { rgb: 'FFFFFF' }, bold: true };
        } else if (delay) {
          // Delay - Red background
          cellStyle.fill = { fgColor: { rgb: 'FF6B6B' } };
          cellStyle.font = { color: { rgb: 'FFFFFF' }, bold: true };
        } else if (taskId && taskColors[taskId]) {
          // Task with color
          const rgbColor = hexToRGB(taskColors[taskId]);
          cellStyle.fill = { fgColor: { rgb: rgbColor.rgb } };
          cellStyle.font = { color: { rgb: '000000' }, bold: true };
        } else if (!siteActive[site]) {
          // Inactive site
          cellStyle.fill = { fgColor: { rgb: 'D3D3D3' } };
          cellStyle.font = { color: { rgb: '666666' } };
        }
        
        worksheet[cellAddr].s = cellStyle;
      }
    });

    // Set column widths
    const colWidths = [
      { wch: 8 },  // Priority
      { wch: 15 }, // Site
      { wch: 10 }  // Status
    ];
    for (let h = 0; h < gridHours; h++) {
      colWidths.push({ wch: 10 }); // Hour columns (wider for delay text)
    }
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');

    // Create summary sheet
    const summaryData = [
      ['Mine Schedule Report'],
      [''],
      ['Generated At:', new Date(schedule.generatedAt).toLocaleString()],
      ['Grid Hours:', gridHours],
      ['Total Sites:', sites.length],
      ['Active Sites:', sites.filter(s => siteActive[s]).length],
      ['Inactive Sites:', sites.filter(s => !siteActive[s]).length],
      [''],
      ['Task Legend:'],
      ['Task ID', 'Color']
    ];

    // Add task colors
    Object.keys(taskColors).forEach(taskId => {
      summaryData.push([taskId, taskColors[taskId]]);
    });
    
    // Add delay information
    summaryData.push([''], ['Shift Changeover Delays:']);
    if (shiftChangeoverDelays && shiftChangeoverDelays.length > 0) {
      const uniqueShiftDelays = [...new Set(shiftChangeoverDelays.map(d => 
        `Hour ${(d.hour || d.hourIndex) + 1}: ${d.shiftCode} - ${d.comments}`
      ))];
      uniqueShiftDelays.forEach(delay => {
        summaryData.push([delay]);
      });
    } else {
      summaryData.push(['No shift changeover delays']);
    }
    
    // Add color legend
    summaryData.push([''], ['Color Legend:']);
    summaryData.push(['Orange Background', 'Shift Changeover']);
    summaryData.push(['Red Background', 'Manual Delay']);
    summaryData.push(['Colored Cells', 'Scheduled Tasks']);
    summaryData.push(['Gray Cells', 'Inactive Sites']);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
    
    // Style summary sheet header
    if (summarySheet['A1']) {
      summarySheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: '0F0E17' } },
        alignment: { horizontal: 'left' }
      };
    }
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    const filename = `MineSchedule_${new Date(schedule.generatedAt).toISOString().split('T')[0]}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('Export schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export schedule',
      error: error.message
    });
  }
};
