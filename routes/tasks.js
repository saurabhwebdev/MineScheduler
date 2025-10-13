const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { generateTaskColor } = require('../utils/colorGenerator');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ order: 1 }).populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      count: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Task not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/tasks
// @desc    Create task
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { taskId, taskName, taskType, uom, rate, taskDuration, formula, limits, color } = req.body;

    // Check if task ID already exists
    const taskExists = await Task.findOne({ taskId });
    if (taskExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Task ID already exists' 
      });
    }

    // Get the highest order number and add 1
    const highestOrderTask = await Task.findOne().sort({ order: -1 });
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      taskId,
      taskName,
      taskType: taskType || 'task',
      uom: uom || 'NA',
      rate: rate || 0,
      taskDuration,
      formula: formula || '',
      limits: limits || 1,
      order,
      color: color || generateTaskColor(),
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'TASK',
      resourceType: 'Task',
      resourceId: task._id,
      resourceName: task.taskName,
      newValues: { taskId: task.taskId, taskName: task.taskName, uom: task.uom, taskDuration: task.taskDuration },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Server error' 
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { taskId, taskName, taskType, uom, rate, taskDuration, formula, limits, color } = req.body;
    
    // Get old values for audit
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Task not found' 
      });
    }

    // Check if task ID is being changed and if it already exists
    if (taskId) {
      const existingTask = await Task.findOne({ taskId, _id: { $ne: req.params.id } });
      if (existingTask) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Task ID already exists' 
        });
      }
    }

    const updateData = {};
    if (taskId) updateData.taskId = taskId;
    if (taskName) updateData.taskName = taskName;
    if (taskType !== undefined) updateData.taskType = taskType;
    if (uom !== undefined) updateData.uom = uom;
    if (rate !== undefined) updateData.rate = rate;
    if (taskDuration !== undefined) updateData.taskDuration = taskDuration;
    if (formula !== undefined) updateData.formula = formula;
    if (limits !== undefined) updateData.limits = limits;
    if (color !== undefined) updateData.color = color;

    // Calculate output if activity-related fields are updated
    const finalTaskType = taskType !== undefined ? taskType : oldTask.taskType;
    const finalRate = rate !== undefined ? rate : oldTask.rate;
    const finalDuration = taskDuration !== undefined ? taskDuration : oldTask.taskDuration;
    
    if (finalTaskType === 'activity' && finalRate && finalDuration) {
      const hours = finalDuration / 60;
      updateData.calculatedOutput = hours * finalRate;
    } else {
      updateData.calculatedOutput = 0;
    }
    
    updateData.updatedAt = Date.now();

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'TASK',
      resourceType: 'Task',
      resourceId: task._id,
      resourceName: task.taskName,
      oldValues: { taskId: oldTask.taskId, taskName: oldTask.taskName, uom: oldTask.uom, taskDuration: oldTask.taskDuration },
      newValues: { taskId: task.taskId, taskName: task.taskName, uom: task.uom, taskDuration: task.taskDuration },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Server error' 
    });
  }
});

// @route   PUT /api/tasks/:id/move
// @desc    Move task up or down
// @access  Private
router.put('/:id/move', protect, async (req, res) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Task not found' 
      });
    }

    const currentOrder = currentTask.order;
    let targetOrder;

    if (direction === 'up') {
      // Find the task just above (lower order number)
      const aboveTask = await Task.findOne({ order: { $lt: currentOrder } }).sort({ order: -1 });
      if (!aboveTask) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Task is already at the top' 
        });
      }
      targetOrder = aboveTask.order;
      
      // Swap orders
      aboveTask.order = currentOrder;
      currentTask.order = targetOrder;
      
      await aboveTask.save();
      await currentTask.save();
    } else if (direction === 'down') {
      // Find the task just below (higher order number)
      const belowTask = await Task.findOne({ order: { $gt: currentOrder } }).sort({ order: 1 });
      if (!belowTask) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Task is already at the bottom' 
        });
      }
      targetOrder = belowTask.order;
      
      // Swap orders
      belowTask.order = currentOrder;
      currentTask.order = targetOrder;
      
      await belowTask.save();
      await currentTask.save();
    } else {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid direction. Use "up" or "down"' 
      });
    }

    // Get updated tasks list
    const tasks = await Task.find().sort({ order: 1 });

    res.json({
      status: 'success',
      data: {
        tasks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Task not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'TASK',
      resourceType: 'Task',
      resourceId: task._id,
      resourceName: task.taskName,
      oldValues: { taskId: task.taskId, taskName: task.taskName, uom: task.uom, taskDuration: task.taskDuration },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    // Reorder remaining tasks
    const tasks = await Task.find().sort({ order: 1 });
    for (let i = 0; i < tasks.length; i++) {
      tasks[i].order = i;
      await tasks[i].save();
    }

    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/tasks/import
// @desc    Import tasks from Excel file
// @access  Private
router.post('/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Excel file is empty'
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const row of data) {
      try {
        if (!row.taskId || !row.taskName || !row.taskDuration) {
          results.skipped.push({
            row: row,
            reason: 'Missing required fields (taskId, taskName, or taskDuration)'
          });
          continue;
        }

        const existingTask = await Task.findOne({ taskId: row.taskId });
        if (existingTask) {
          results.skipped.push({
            row: row,
            reason: `Task ID '${row.taskId}' already exists`
          });
          continue;
        }

        // Get the highest order number
        const highestOrderTask = await Task.findOne().sort({ order: -1 });
        const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

        // Determine task type
        let taskType = 'task';
        if (row.taskType) {
          const lowerType = row.taskType.toLowerCase().trim();
          taskType = (lowerType === 'activity' || lowerType === 'act') ? 'activity' : 'task';
        }

        // Parse and validate limits (must be 1-10)
        let limits = 1;
        if (row.limits) {
          const parsedLimits = parseInt(row.limits);
          if (!isNaN(parsedLimits) && parsedLimits >= 1 && parsedLimits <= 10) {
            limits = parsedLimits;
          }
        }

        const task = await Task.create({
          taskId: row.taskId.toString().trim(),
          taskName: row.taskName.toString().trim(),
          taskType: taskType,
          uom: row.uom ? row.uom.toString().trim() : 'NA',
          rate: row.rate ? parseFloat(row.rate) : 0,
          taskDuration: parseFloat(row.taskDuration),
          formula: row.formula ? row.formula.toString().trim() : '',
          limits: limits,
          order,
          color: generateTaskColor(),
          createdBy: req.user.id
        });

        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'TASK',
          resourceType: 'Task',
          resourceId: task._id,
          resourceName: task.taskName,
          newValues: { taskId: task.taskId, taskName: task.taskName, taskType: task.taskType, uom: task.uom, rate: task.rate, taskDuration: task.taskDuration },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(row.taskId);
      } catch (error) {
        results.failed.push({
          row: row,
          reason: error.message
        });
      }
    }

    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'TASK',
      resourceType: 'Task Import',
      resourceId: 'bulk',
      resourceName: 'Excel Import',
      newValues: { 
        totalRows: data.length,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: `Import completed: ${results.success.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to import Excel file'
    });
  }
});

module.exports = router;
