const Site = require('../models/Site');
const Task = require('../models/Task');
const Constant = require('../models/Constant');
const Shift = require('../models/Shift');
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

    // 11. Return schedule data
    res.json({
      status: 'success',
      data: {
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
