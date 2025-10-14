const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Delay = require('../models/Delay');
const { protect, authorize } = require('../middleware/auth');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// Configure multer for file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
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

// @route   GET /api/delays
// @desc    Get all delays
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const delays = await Delay.find().sort({ delayCategory: 1, delayCode: 1 }).populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      count: delays.length,
      data: {
        delays
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

// @route   GET /api/delays/:id
// @desc    Get delay by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const delay = await Delay.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!delay) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Delay not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        delay
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

// @route   POST /api/delays
// @desc    Create delay
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { delayCategory, delayCode, description, isActive, delayType, delayDuration } = req.body;

    // Check if delay code already exists
    const delayExists = await Delay.findOne({ delayCode });
    if (delayExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Delay code already exists' 
      });
    }

    const delay = await Delay.create({
      delayCategory,
      delayCode,
      delayType: delayType || 'custom',
      description,
      delayDuration: delayType === 'standard' ? (delayDuration !== undefined ? delayDuration : null) : null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'DELAY',
      resourceType: 'Delay',
      resourceId: delay._id,
      resourceName: delay.delayCode,
      newValues: { delayCategory: delay.delayCategory, delayCode: delay.delayCode, delayType: delay.delayType, description: delay.description, delayDuration: delay.delayDuration, isActive: delay.isActive },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        delay
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

// @route   PUT /api/delays/:id
// @desc    Update delay
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { delayCategory, delayCode, description, isActive, delayType, delayDuration } = req.body;
    
    // Get old values for audit
    const oldDelay = await Delay.findById(req.params.id);
    if (!oldDelay) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Delay not found' 
      });
    }

    // Check if delay code is being changed and if it already exists
    if (delayCode && delayCode !== oldDelay.delayCode) {
      const existingDelay = await Delay.findOne({ delayCode, _id: { $ne: req.params.id } });
      if (existingDelay) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Delay code already exists' 
        });
      }
    }

    const updateData = {};
    if (delayCategory !== undefined) updateData.delayCategory = delayCategory;
    if (delayCode !== undefined) updateData.delayCode = delayCode;
    if (delayType !== undefined) updateData.delayType = delayType;
    if (description !== undefined) updateData.description = description;
    if (delayDuration !== undefined) updateData.delayDuration = delayType === 'standard' ? delayDuration : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const delay = await Delay.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'DELAY',
      resourceType: 'Delay',
      resourceId: delay._id,
      resourceName: delay.delayCode,
      oldValues: { delayCategory: oldDelay.delayCategory, delayCode: oldDelay.delayCode, delayType: oldDelay.delayType, description: oldDelay.description, delayDuration: oldDelay.delayDuration, isActive: oldDelay.isActive },
      newValues: { delayCategory: delay.delayCategory, delayCode: delay.delayCode, delayType: delay.delayType, description: delay.description, delayDuration: delay.delayDuration, isActive: delay.isActive },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        delay
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

// @route   DELETE /api/delays/:id
// @desc    Delete delay
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const delay = await Delay.findByIdAndDelete(req.params.id);

    if (!delay) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Delay not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'DELAY',
      resourceType: 'Delay',
      resourceId: delay._id,
      resourceName: delay.delayCode,
      oldValues: { delayCategory: delay.delayCategory, delayCode: delay.delayCode, delayType: delay.delayType, description: delay.description, delayDuration: delay.delayDuration, isActive: delay.isActive },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'Delay deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/delays/import
// @desc    Import delays from Excel file
// @access  Private
router.post('/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Parse Excel file
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

    // Process each row
    for (const row of data) {
      try {
        // Validate required fields
        if (!row.delayCategory || !row.delayCode || !row.description) {
          results.skipped.push({
            row: row,
            reason: 'Missing required fields (delayCategory, delayCode, or description)'
          });
          continue;
        }

        // Check if delay code already exists
        const existingDelay = await Delay.findOne({ delayCode: row.delayCode });
        if (existingDelay) {
          results.skipped.push({
            row: row,
            reason: `Delay code '${row.delayCode}' already exists`
          });
          continue;
        }

        // Determine isActive status
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

        // Parse delayType (default custom)
        let delayType = 'custom';
        if (row.delayType) {
          const type = row.delayType.toString().toLowerCase().trim();
          delayType = (type === 'standard' || type === 'std') ? 'standard' : 'custom';
        }

        // Parse delayDuration (only for standard delays)
        let delayDuration = null;
        if (delayType === 'standard' && row.delayDuration !== undefined && row.delayDuration !== null && row.delayDuration !== '') {
          const parsed = parseFloat(row.delayDuration);
          if (!isNaN(parsed) && parsed >= 0) {
            delayDuration = parsed;
          }
        }

        // Create delay
        const delay = await Delay.create({
          delayCategory: row.delayCategory.toString().trim(),
          delayCode: row.delayCode.toString().trim(),
          delayType: delayType,
          description: row.description.toString().trim(),
          delayDuration: delayDuration,
          isActive: isActive,
          createdBy: req.user.id
        });

        // Log audit
        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'DELAY',
          resourceType: 'Delay',
          resourceId: delay._id,
          resourceName: delay.delayCode,
          newValues: { delayCategory: delay.delayCategory, delayCode: delay.delayCode, description: delay.description, isActive: delay.isActive },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(row.delayCode);
      } catch (error) {
        results.failed.push({
          row: row,
          reason: error.message
        });
      }
    }

    // Log bulk import audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'DELAY',
      resourceType: 'Delay Import',
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
