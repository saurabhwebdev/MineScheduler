const Equipment = require('../models/Equipment');

/**
 * Get maintenance overview for all equipment
 * GET /api/maintenance/overview
 */
exports.getMaintenanceOverview = async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('createdBy', 'name email')
      .sort({ status: 1, operatingHours: -1 });

    // Calculate statistics
    const stats = {
      total: equipment.length,
      operational: equipment.filter(e => e.status === 'operational').length,
      inMaintenance: equipment.filter(e => e.status === 'maintenance').length,
      outOfService: equipment.filter(e => e.status === 'out-of-service').length,
      overdue: 0,
      dueSoon: 0,
      good: 0
    };

    // Categorize by maintenance status
    const equipmentWithStatus = equipment.map(e => {
      const eq = e.toJSON();
      
      // Calculate maintenance status based on operating hours
      let maintenanceStatus = 'unknown';
      let hoursUntilMaintenance = null;
      
      if (eq.maintenanceInterval && eq.maintenanceInterval > 0) {
        hoursUntilMaintenance = Math.max(0, eq.maintenanceInterval - eq.operatingHours);
        const percentUsed = (eq.operatingHours / eq.maintenanceInterval) * 100;
        
        if (percentUsed >= 100) {
          maintenanceStatus = 'overdue';
          stats.overdue++;
        } else if (percentUsed >= 80) {
          maintenanceStatus = 'due-soon';
          stats.dueSoon++;
        } else {
          maintenanceStatus = 'good';
          stats.good++;
        }
      }
      
      return {
        ...eq,
        maintenanceStatus,
        hoursUntilMaintenance,
        percentUsed: eq.maintenanceInterval > 0 
          ? Math.min(100, (eq.operatingHours / eq.maintenanceInterval) * 100).toFixed(1)
          : 0
      };
    });

    res.json({
      status: 'success',
      data: {
        equipment: equipmentWithStatus,
        stats
      }
    });

  } catch (error) {
    console.error('Get maintenance overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance overview',
      error: error.message
    });
  }
};

/**
 * Update equipment operating hours
 * PUT /api/maintenance/equipment/:id/hours
 */
exports.updateOperatingHours = async (req, res) => {
  try {
    const { hours } = req.body;
    
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }

    equipment.operatingHours = hours;
    await equipment.save();

    res.json({
      status: 'success',
      data: {
        equipment: equipment.toJSON()
      }
    });

  } catch (error) {
    console.error('Update operating hours error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update operating hours',
      error: error.message
    });
  }
};

/**
 * Reset equipment maintenance (after maintenance completed)
 * POST /api/maintenance/equipment/:id/reset
 */
exports.resetMaintenance = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }

    equipment.operatingHours = 0;
    equipment.lastMaintenance = new Date();
    equipment.status = 'operational';
    await equipment.save();

    res.json({
      status: 'success',
      message: 'Maintenance reset successfully',
      data: {
        equipment: equipment.toJSON()
      }
    });

  } catch (error) {
    console.error('Reset maintenance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset maintenance',
      error: error.message
    });
  }
};
