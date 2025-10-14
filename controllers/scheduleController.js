const Site = require('../models/Site');
const Task = require('../models/Task');
const Constant = require('../models/Constant');
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

    // 2. Build delay map: site → Set of blocked hours
    const delayMap = {};
    (delayedSlots || []).forEach(d => {
      const site = d.row || d.site;
      const hour = d.hour !== undefined ? d.hour : d.hourIndex;
      if (site && typeof hour === 'number' && hour >= 0 && hour < gridHours) {
        if (!delayMap[site]) delayMap[site] = new Set();
        delayMap[site].add(hour);
      }
    });

    // 3. Initialize data structures
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

    // 4. Build task lookups
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task.taskId] = task;
      taskLimits[task.taskId] = task.limits || 2;
      taskColors[task.taskId] = task.color || '#3498db';
    });

    // 5. Get default task (SEQ = 1 or first task)
    const defaultTask = tasks.find(t => t.order === 1) || tasks[0];
    const defaultTaskId = defaultTask ? defaultTask.taskId : 'DEFAULT';

    // 6. Process each site
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

      // 7. Build task cycle based on firings
      const taskCycle = buildTaskCycle(currentTaskId, site.firings || 0, tasks);

      // 8. Track if we've used timeToComplete override
      let usedTimeToComplete = false;

      // 9. Allocate tasks in cycle
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

    // 10. Return schedule data
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
        gridHours
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
