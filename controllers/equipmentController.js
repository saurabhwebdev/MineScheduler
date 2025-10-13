const Equipment = require('../models/Equipment');
const MaintenanceLog = require('../models/MaintenanceLog');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
exports.getEquipment = async (req, res) => {
  try {
    const { type, status, location, search, sort } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by location
    if (location) {
      query.location = location;
    }
    
    // Search by equipment ID or name
    if (search) {
      query.$or = [
        { equipmentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    let sortOption = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      sortOption = { equipmentId: 1 };
    }
    
    const equipment = await Equipment.find(query).sort(sortOption);
    
    res.status(200).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch equipment'
    });
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
exports.getSingleEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch equipment'
    });
  }
};

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private
exports.createEquipment = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    const equipment = await Equipment.create(req.body);
    
    // Log audit
    await logAudit({
      user: req.user.id,
      action: 'CREATE',
      resource: 'Equipment',
      resourceId: equipment._id,
      details: `Created equipment: ${equipment.equipmentId} - ${equipment.name}`,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Equipment ID already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create equipment'
    });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
exports.updateEquipment = async (req, res) => {
  try {
    let equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    const oldValues = equipment.toObject();
    
    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Log audit
    await logAudit({
      user: req.user.id,
      action: 'UPDATE',
      resource: 'Equipment',
      resourceId: equipment._id,
      details: `Updated equipment: ${equipment.equipmentId} - ${equipment.name}`,
      changes: { before: oldValues, after: equipment.toObject() },
      ipAddress: req.ip
    });
    
    res.status(200).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Equipment ID already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update equipment'
    });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    await equipment.deleteOne();
    
    // Also delete all maintenance logs for this equipment
    await MaintenanceLog.deleteMany({ equipment: equipment._id });
    
    // Log audit
    await logAudit({
      user: req.user.id,
      action: 'DELETE',
      resource: 'Equipment',
      resourceId: equipment._id,
      details: `Deleted equipment: ${equipment.equipmentId} - ${equipment.name}`,
      ipAddress: req.ip
    });
    
    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete equipment'
    });
  }
};

// @desc    Import equipment from JSON
// @route   POST /api/equipment/import
// @access  Private
exports.importEquipment = async (req, res) => {
  try {
    const { equipment } = req.body;
    
    if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of equipment to import'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const equipmentData of equipment) {
      try {
        equipmentData.createdBy = req.user.id;
        
        const newEquipment = await Equipment.create(equipmentData);
        results.success.push({
          equipmentId: newEquipment.equipmentId,
          name: newEquipment.name
        });
        
        await logAudit({
          user: req.user.id,
          action: 'CREATE',
          resource: 'Equipment',
          resourceId: newEquipment._id,
          details: `Imported equipment: ${newEquipment.equipmentId} - ${newEquipment.name}`,
          ipAddress: req.ip
        });
      } catch (error) {
        results.failed.push({
          equipmentId: equipmentData.equipmentId || 'Unknown',
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        imported: results.success.length,
        failed: results.failed.length,
        results
      }
    });
  } catch (error) {
    console.error('Error importing equipment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import equipment'
    });
  }
};

// @desc    Export equipment to JSON
// @route   GET /api/equipment/export
// @access  Private
exports.exportEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ equipmentId: 1 });
    
    res.status(200).json({
      status: 'success',
      data: { equipment }
    });
  } catch (error) {
    console.error('Error exporting equipment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export equipment'
    });
  }
};

// @desc    Log maintenance for equipment
// @route   POST /api/equipment/:id/maintenance
// @access  Private
exports.logMaintenance = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    // Create maintenance log
    req.body.equipment = equipment._id;
    req.body.createdBy = req.user.id;
    
    const maintenanceLog = await MaintenanceLog.create(req.body);
    
    // Update equipment maintenance info
    equipment.lastMaintenance = maintenanceLog.performedDate;
    if (maintenanceLog.nextDue) {
      equipment.nextMaintenance = maintenanceLog.nextDue;
    }
    
    // If maintenance is complete, update status
    if (equipment.status === 'maintenance' && req.body.maintenanceType !== 'inspection') {
      equipment.status = 'operational';
    }
    
    await equipment.save();
    
    // Log audit
    await logAudit({
      user: req.user.id,
      action: 'CREATE',
      resource: 'MaintenanceLog',
      resourceId: maintenanceLog._id,
      details: `Logged ${maintenanceLog.maintenanceType} maintenance for ${equipment.equipmentId}`,
      ipAddress: req.ip
    });
    
    res.status(201).json({
      status: 'success',
      data: { maintenanceLog, equipment }
    });
  } catch (error) {
    console.error('Error logging maintenance:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to log maintenance'
    });
  }
};

// @desc    Get maintenance history for equipment
// @route   GET /api/equipment/:id/history
// @access  Private
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    const history = await MaintenanceLog.find({ equipment: equipment._id })
      .sort({ performedDate: -1 })
      .populate('createdBy', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance history'
    });
  }
};

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Private
exports.getEquipmentStats = async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const operational = await Equipment.countDocuments({ status: 'operational' });
    const maintenance = await Equipment.countDocuments({ status: 'maintenance' });
    const outOfService = await Equipment.countDocuments({ status: 'out-of-service' });
    
    const equipmentByType = await Equipment.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get equipment due for maintenance
    const now = new Date();
    const dueSoon = await Equipment.countDocuments({
      nextMaintenance: {
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
    
    const overdue = await Equipment.countDocuments({
      nextMaintenance: { $lt: now }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalEquipment,
        operational,
        maintenance,
        outOfService,
        equipmentByType,
        maintenanceAlerts: {
          dueSoon,
          overdue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch equipment statistics'
    });
  }
};
