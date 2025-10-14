const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const EquipmentType = require('../models/EquipmentType');
const { protect, authorize } = require('../middleware/auth');
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

// @route   GET /api/equipment-types
// @desc    Get all equipment types
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.find()
      .sort({ name: 1 })
      .populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      count: equipmentTypes.length,
      data: {
        equipmentTypes
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

// @route   GET /api/equipment-types/export
// @desc    Export equipment types to Excel file
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.find().sort({ name: 1 });

    const exportData = equipmentTypes.map(type => ({
      name: type.name,
      description: type.description || '',
      icon: type.icon || '',
      isActive: type.isActive ? 'Active' : 'Inactive'
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Equipment Types');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=equipment_types_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export equipment types'
    });
  }
});

// @route   GET /api/equipment-types/:id
// @desc    Get equipment type by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const equipmentType = await EquipmentType.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!equipmentType) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Equipment type not found' 
      });
    }

    res.json({
      status: 'success',
      data: {
        equipmentType
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

// @route   POST /api/equipment-types
// @desc    Create equipment type
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    // Check if equipment type already exists
    const typeExists = await EquipmentType.findOne({ name });
    if (typeExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Equipment type already exists' 
      });
    }

    const equipmentType = await EquipmentType.create({
      name,
      description: description || '',
      icon: icon || 'ToolOutlined',
      createdBy: req.user.id
    });

    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'EQUIPMENT_TYPE',
      resourceType: 'Equipment Type',
      resourceId: equipmentType._id,
      resourceName: equipmentType.name,
      newValues: { name: equipmentType.name, description: equipmentType.description },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      status: 'success',
      data: {
        equipmentType
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

// @route   PUT /api/equipment-types/:id
// @desc    Update equipment type
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, isActive } = req.body;
    
    // Get old values for audit
    const oldType = await EquipmentType.findById(req.params.id);
    if (!oldType) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Equipment type not found' 
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== oldType.name) {
      const existingType = await EquipmentType.findOne({ name, _id: { $ne: req.params.id } });
      if (existingType) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Equipment type name already exists' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = Date.now();

    const equipmentType = await EquipmentType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'EQUIPMENT_TYPE',
      resourceType: 'Equipment Type',
      resourceId: equipmentType._id,
      resourceName: equipmentType.name,
      oldValues: { name: oldType.name, description: oldType.description, isActive: oldType.isActive },
      newValues: { name: equipmentType.name, description: equipmentType.description, isActive: equipmentType.isActive },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      data: {
        equipmentType
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

// @route   DELETE /api/equipment-types/:id
// @desc    Delete equipment type
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const equipmentType = await EquipmentType.findByIdAndDelete(req.params.id);

    if (!equipmentType) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Equipment type not found' 
      });
    }

    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'EQUIPMENT_TYPE',
      resourceType: 'Equipment Type',
      resourceId: equipmentType._id,
      resourceName: equipmentType.name,
      oldValues: { name: equipmentType.name, description: equipmentType.description },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'Equipment type deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// @route   POST /api/equipment-types/import
// @desc    Import equipment types from Excel file
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

        const typeName = row.name.toString().trim();
        const existingType = await EquipmentType.findOne({ name: typeName });
        if (existingType) {
          results.skipped.push({
            row: row,
            reason: `Equipment type '${typeName}' already exists`
          });
          continue;
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

        const equipmentType = await EquipmentType.create({
          name: typeName,
          description: row.description ? row.description.toString().trim() : '',
          icon: row.icon ? row.icon.toString().trim() : 'ToolOutlined',
          isActive: isActive,
          createdBy: req.user.id
        });

        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'EQUIPMENT_TYPE',
          resourceType: 'Equipment Type',
          resourceId: equipmentType._id,
          resourceName: equipmentType.name,
          newValues: { name: equipmentType.name, description: equipmentType.description },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(typeName);
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
      module: 'EQUIPMENT_TYPE',
      resourceType: 'Equipment Type Import',
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
