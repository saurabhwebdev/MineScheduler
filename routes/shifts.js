const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Shift = require('../models/Shift');
const { protect } = require('../middleware/auth');
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

// @route   GET /api/shifts
// @desc    Get all shifts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ shiftCode: 1 }).populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      count: shifts.length,
      data: {
        shifts
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

// @route   GET /api/shifts/:id
// @desc    Get shift by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!shift) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Shift not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        shift
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

// @route   POST /api/shifts
// @desc    Create shift
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { shiftName, shiftCode, startTime, endTime, shiftChangeDuration, color, description, isActive } = req.body;

    // Check if shift code already exists
    const shiftExists = await Shift.findOne({ shiftCode: shiftCode.toUpperCase() });
    if (shiftExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Shift code already exists' 
      });
    }

    const shift = await Shift.create({
      shiftName,
      shiftCode: shiftCode.toUpperCase(),
      startTime,
      endTime,
      shiftChangeDuration,
      color: color || '#1890ff',
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'SETTINGS',
      resourceType: 'Shift',
      resourceId: shift._id,
      resourceName: shift.shiftName,
      newValues: { 
        shiftName: shift.shiftName, 
        shiftCode: shift.shiftCode, 
        startTime: shift.startTime, 
        endTime: shift.endTime,
        shiftChangeDuration: shift.shiftChangeDuration,
        isActive: shift.isActive 
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        shift
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

// @route   PUT /api/shifts/:id
// @desc    Update shift
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { shiftName, shiftCode, startTime, endTime, shiftChangeDuration, color, description, isActive } = req.body;
    
    // Get old values for audit
    const oldShift = await Shift.findById(req.params.id);
    if (!oldShift) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Shift not found' 
      });
    }

    // Check if shift code is being changed and if it already exists
    if (shiftCode && shiftCode.toUpperCase() !== oldShift.shiftCode) {
      const existingShift = await Shift.findOne({ shiftCode: shiftCode.toUpperCase(), _id: { $ne: req.params.id } });
      if (existingShift) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Shift code already exists' 
        });
      }
    }

    const updateData = {};
    if (shiftName !== undefined) updateData.shiftName = shiftName;
    if (shiftCode !== undefined) updateData.shiftCode = shiftCode.toUpperCase();
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (shiftChangeDuration !== undefined) updateData.shiftChangeDuration = shiftChangeDuration;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = Date.now();

    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'SETTINGS',
      resourceType: 'Shift',
      resourceId: shift._id,
      resourceName: shift.shiftName,
      oldValues: { 
        shiftName: oldShift.shiftName, 
        shiftCode: oldShift.shiftCode, 
        startTime: oldShift.startTime, 
        endTime: oldShift.endTime,
        shiftChangeDuration: oldShift.shiftChangeDuration,
        isActive: oldShift.isActive 
      },
      newValues: { 
        shiftName: shift.shiftName, 
        shiftCode: shift.shiftCode, 
        startTime: shift.startTime, 
        endTime: shift.endTime,
        shiftChangeDuration: shift.shiftChangeDuration,
        isActive: shift.isActive 
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        shift
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

// @route   DELETE /api/shifts/:id
// @desc    Delete shift
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);

    if (!shift) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Shift not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'SETTINGS',
      resourceType: 'Shift',
      resourceId: shift._id,
      resourceName: shift.shiftName,
      oldValues: { 
        shiftName: shift.shiftName, 
        shiftCode: shift.shiftCode, 
        startTime: shift.startTime, 
        endTime: shift.endTime,
        shiftChangeDuration: shift.shiftChangeDuration,
        isActive: shift.isActive 
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/shifts/import
// @desc    Import shifts from Excel file
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
        if (!row.shiftName || !row.shiftCode || !row.startTime || !row.endTime) {
          results.skipped.push({
            row: row,
            reason: 'Missing required fields (shiftName, shiftCode, startTime, or endTime)'
          });
          continue;
        }

        const shiftCodeUpper = row.shiftCode.toString().trim().toUpperCase();
        const existingShift = await Shift.findOne({ shiftCode: shiftCodeUpper });
        if (existingShift) {
          results.skipped.push({
            row: row,
            reason: `Shift code '${shiftCodeUpper}' already exists`
          });
          continue;
        }

        // Parse shiftChangeDuration
        let shiftChangeDuration = 30; // Default
        if (row.shiftChangeDuration !== undefined && row.shiftChangeDuration !== null && row.shiftChangeDuration !== '') {
          const parsed = parseFloat(row.shiftChangeDuration);
          if (!isNaN(parsed) && parsed >= 0) {
            shiftChangeDuration = parsed;
          }
        }

        // Parse isActive
        let isActive = true;
        if (row.isActive !== undefined && row.isActive !== null) {
          if (typeof row.isActive === 'boolean') {
            isActive = row.isActive;
          } else if (typeof row.isActive === 'string') {
            const lowerStatus = row.isActive.toLowerCase().trim();
            isActive = lowerStatus === 'true' || lowerStatus === 'active' || lowerStatus === 'yes' || lowerStatus === '1';
          } else if (typeof row.isActive === 'number') {
            isActive = row.isActive === 1;
          }
        }

        const shift = await Shift.create({
          shiftName: row.shiftName.toString().trim(),
          shiftCode: shiftCodeUpper,
          startTime: row.startTime.toString().trim(),
          endTime: row.endTime.toString().trim(),
          shiftChangeDuration: shiftChangeDuration,
          color: row.color ? row.color.toString().trim() : '#1890ff',
          description: row.description ? row.description.toString().trim() : '',
          isActive: isActive,
          createdBy: req.user.id
        });

        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'SETTINGS',
          resourceType: 'Shift',
          resourceId: shift._id,
          resourceName: shift.shiftName,
          newValues: { 
            shiftName: shift.shiftName, 
            shiftCode: shift.shiftCode, 
            startTime: shift.startTime, 
            endTime: shift.endTime,
            shiftChangeDuration: shift.shiftChangeDuration,
            isActive: shift.isActive 
          },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(shift.shiftCode);
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
      module: 'SETTINGS',
      resourceType: 'Shift Import',
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
