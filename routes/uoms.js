const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Uom = require('../models/Uom');
const { protect, authorize } = require('../middleware/auth');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// @route   GET /api/uoms
// @desc    Get all UOMs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const uoms = await Uom.find().sort({ name: 1 }).populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      count: uoms.length,
      data: {
        uoms
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

// @route   GET /api/uoms/:id
// @desc    Get UOM by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const uom = await Uom.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!uom) {
      return res.status(404).json({ 
        status: 'error',
        message: 'UOM not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        uom
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

// @route   POST /api/uoms
// @desc    Create UOM
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if UOM already exists
    const uomExists = await Uom.findOne({ name });
    if (uomExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'UOM already exists' 
      });
    }

    const uom = await Uom.create({
      name,
      description: description || '',
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'UOM',
      resourceType: 'UOM',
      resourceId: uom._id,
      resourceName: uom.name,
      newValues: { name: uom.name, description: uom.description },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        uom
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

// @route   PUT /api/uoms/:id
// @desc    Update UOM
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if name is being changed and if it already exists
    if (name) {
      const existingUom = await Uom.findOne({ name, _id: { $ne: req.params.id } });
      if (existingUom) {
        return res.status(400).json({ 
          status: 'error',
          message: 'UOM name already exists' 
        });
      }
    }

    // Get old values for audit
    const oldUom = await Uom.findById(req.params.id);
    if (!oldUom) {
      return res.status(404).json({ 
        status: 'error',
        message: 'UOM not found' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const uom = await Uom.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'UOM',
      resourceType: 'UOM',
      resourceId: uom._id,
      resourceName: uom.name,
      oldValues: { name: oldUom.name, description: oldUom.description },
      newValues: { name: uom.name, description: uom.description },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        uom
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

// @route   DELETE /api/uoms/:id
// @desc    Delete UOM
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const uom = await Uom.findByIdAndDelete(req.params.id);

    if (!uom) {
      return res.status(404).json({ 
        status: 'error',
        message: 'UOM not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'UOM',
      resourceType: 'UOM',
      resourceId: uom._id,
      resourceName: uom.name,
      oldValues: { name: uom.name, description: uom.description },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'UOM deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/uoms/import
// @desc    Import UOMs from Excel file
// @access  Private (Admin only)
router.post('/import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
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
        if (!row.name) {
          results.skipped.push({
            row: row,
            reason: 'Missing required field: name'
          });
          continue;
        }

        const uomName = row.name.toString().trim();
        const existingUom = await Uom.findOne({ name: uomName });
        if (existingUom) {
          results.skipped.push({
            row: row,
            reason: `UOM '${uomName}' already exists`
          });
          continue;
        }

        const uom = await Uom.create({
          name: uomName,
          description: row.description ? row.description.toString().trim() : '',
          createdBy: req.user.id
        });

        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'UOM',
          resourceType: 'UOM',
          resourceId: uom._id,
          resourceName: uom.name,
          newValues: { name: uom.name, description: uom.description },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(uomName);
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
      module: 'UOM',
      resourceType: 'UOM Import',
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
      message: 'Import completed',
      data: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/uoms/export
// @desc    Export UOMs to Excel file
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const uoms = await Uom.find().sort({ name: 1 });

    const exportData = uoms.map(uom => ({
      name: uom.name,
      description: uom.description || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'UOMs');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=uoms_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export UOMs'
    });
  }
});

module.exports = router;
