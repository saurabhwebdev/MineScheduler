const MaintenanceLog = require('../models/MaintenanceLog');
const Equipment = require('../models/Equipment');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

/**
 * Get all maintenance logs with filters
 * GET /api/maintenance-logs
 */
exports.getMaintenanceLogs = async (req, res) => {
  try {
    const { 
      equipment, 
      type, 
      startDate, 
      endDate, 
      minCost, 
      maxCost, 
      performedBy,
      sort 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (equipment) {
      query.equipment = equipment;
    }
    
    if (type) {
      query.maintenanceType = type;
    }
    
    if (performedBy) {
      query.performedBy = { $regex: performedBy, $options: 'i' };
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.performedDate = {};
      if (startDate) {
        query.performedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.performedDate.$lte = new Date(endDate);
      }
    }
    
    // Cost range filter
    if (minCost || maxCost) {
      query.cost = {};
      if (minCost) {
        query.cost.$gte = parseFloat(minCost);
      }
      if (maxCost) {
        query.cost.$lte = parseFloat(maxCost);
      }
    }
    
    // Build sort
    let sortOption = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      sortOption = { performedDate: -1 };
    }
    
    const logs = await MaintenanceLog.find(query)
      .populate('equipment', 'equipmentId name type status')
      .populate('createdBy', 'name email')
      .sort(sortOption);
    
    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: { logs }
    });
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance logs'
    });
  }
};

/**
 * Get single maintenance log
 * GET /api/maintenance-logs/:id
 */
exports.getSingleMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('equipment', 'equipmentId name type status manufacturer model')
      .populate('createdBy', 'name email');
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance log not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    console.error('Error fetching maintenance log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance log'
    });
  }
};

/**
 * Create new maintenance log
 * POST /api/maintenance-logs
 */
exports.createMaintenanceLog = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Verify equipment exists
    const equipment = await Equipment.findById(req.body.equipment);
    if (!equipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Equipment not found'
      });
    }
    
    const log = await MaintenanceLog.create(req.body);
    
    // Update equipment maintenance info
    equipment.lastMaintenance = log.performedDate;
    if (log.nextDue) {
      equipment.nextMaintenance = log.nextDue;
    }
    await equipment.save();
    
    // Populate for response
    await log.populate('equipment', 'equipmentId name type');
    await log.populate('createdBy', 'name email');
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'MAINTENANCE_LOGS',
      resourceType: 'MaintenanceLog',
      resourceId: log._id,
      resourceName: `${log.maintenanceType} - ${equipment.equipmentId}`,
      newValues: log.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(201).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create maintenance log'
    });
  }
};

/**
 * Update maintenance log
 * PUT /api/maintenance-logs/:id
 */
exports.updateMaintenanceLog = async (req, res) => {
  try {
    let log = await MaintenanceLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance log not found'
      });
    }
    
    const oldValues = log.toObject();
    
    log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('equipment', 'equipmentId name type')
      .populate('createdBy', 'name email');
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'MAINTENANCE_LOGS',
      resourceType: 'MaintenanceLog',
      resourceId: log._id,
      resourceName: `${log.maintenanceType} - ${log.equipment?.equipmentId || 'Unknown'}`,
      oldValues: oldValues,
      newValues: log.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(200).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update maintenance log'
    });
  }
};

/**
 * Delete maintenance log
 * DELETE /api/maintenance-logs/:id
 */
exports.deleteMaintenanceLog = async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('equipment', 'equipmentId');
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance log not found'
      });
    }
    
    await log.deleteOne();
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'MAINTENANCE_LOGS',
      resourceType: 'MaintenanceLog',
      resourceId: log._id,
      resourceName: `${log.maintenanceType} - ${log.equipment?.equipmentId || 'Unknown'}`,
      oldValues: log.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete maintenance log'
    });
  }
};

/**
 * Get maintenance statistics
 * GET /api/maintenance-logs/stats
 */
exports.getMaintenanceStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Total logs count
    const totalLogs = await MaintenanceLog.countDocuments();
    
    // Current month stats
    const monthLogs = await MaintenanceLog.find({
      performedDate: { $gte: startOfMonth }
    });
    
    const monthCost = monthLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const monthCount = monthLogs.length;
    
    // Current year stats
    const yearLogs = await MaintenanceLog.find({
      performedDate: { $gte: startOfYear }
    });
    
    const yearCost = yearLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    
    // Upcoming maintenance (next 7 days)
    const upcomingDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = await MaintenanceLog.countDocuments({
      nextDue: { $gte: now, $lte: upcomingDate }
    });
    
    // Overdue maintenance
    const overdue = await MaintenanceLog.countDocuments({
      nextDue: { $lt: now, $ne: null }
    });
    
    // Average cost
    const allLogsWithCost = await MaintenanceLog.find({ cost: { $gt: 0 } });
    const avgCost = allLogsWithCost.length > 0
      ? allLogsWithCost.reduce((sum, log) => sum + log.cost, 0) / allLogsWithCost.length
      : 0;
    
    // Maintenance by type
    const byType = await MaintenanceLog.aggregate([
      {
        $group: {
          _id: '$maintenanceType',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);
    
    // Most maintained equipment
    const byEquipment = await MaintenanceLog.aggregate([
      {
        $group: {
          _id: '$equipment',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate equipment details
    const equipmentIds = byEquipment.map(item => item._id);
    const equipmentDetails = await Equipment.find({ _id: { $in: equipmentIds } })
      .select('equipmentId name type');
    
    const topEquipment = byEquipment.map(item => {
      const equipment = equipmentDetails.find(eq => eq._id.toString() === item._id.toString());
      return {
        equipment: equipment || null,
        count: item.count,
        totalCost: item.totalCost
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalLogs,
        currentMonth: {
          count: monthCount,
          cost: monthCost
        },
        currentYear: {
          cost: yearCost,
          count: yearLogs.length
        },
        upcoming,
        overdue,
        averageCost: avgCost,
        byType,
        topEquipment
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance statistics'
    });
  }
};

/**
 * Export maintenance logs to JSON
 * GET /api/maintenance-logs/export
 */
exports.exportMaintenanceLogs = async (req, res) => {
  try {
    const logs = await MaintenanceLog.find()
      .populate('equipment', 'equipmentId name type')
      .sort({ performedDate: -1 });
    
    const exportData = logs.map(log => ({
      equipmentId: log.equipment?.equipmentId || '',
      equipmentName: log.equipment?.name || '',
      equipmentType: log.equipment?.type || '',
      maintenanceType: log.maintenanceType,
      description: log.description,
      performedDate: log.performedDate,
      nextDue: log.nextDue,
      laborCost: log.laborCost || 0,
      partsCost: log.partsCost || 0,
      cost: log.cost,
      duration: log.duration,
      performedBy: log.performedBy,
      notes: log.notes
    }));
    
    res.status(200).json({
      status: 'success',
      data: { logs: exportData }
    });
  } catch (error) {
    console.error('Error exporting maintenance logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export maintenance logs'
    });
  }
};

/**
 * Import maintenance logs from JSON
 * POST /api/maintenance-logs/import
 */
exports.importMaintenanceLogs = async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of maintenance logs to import'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const logData of logs) {
      try {
        // Find equipment by equipmentId
        if (logData.equipmentId) {
          const equipment = await Equipment.findOne({ equipmentId: logData.equipmentId });
          if (equipment) {
            logData.equipment = equipment._id;
            delete logData.equipmentId;
            delete logData.equipmentName;
            delete logData.equipmentType;
          } else {
            results.failed.push({
              data: logData,
              error: `Equipment ${logData.equipmentId} not found`
            });
            continue;
          }
        }
        
        logData.createdBy = req.user.id;
        
        const newLog = await MaintenanceLog.create(logData);
        results.success.push({
          id: newLog._id,
          equipment: logData.equipmentId,
          type: newLog.maintenanceType
        });
        
        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'MAINTENANCE_LOGS',
          resourceType: 'MaintenanceLog',
          resourceId: newLog._id,
          resourceName: `${newLog.maintenanceType} - Import`,
          newValues: newLog.toObject(),
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });
      } catch (error) {
        results.failed.push({
          data: logData,
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
    console.error('Error importing maintenance logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import maintenance logs'
    });
  }
};

/**
 * Get comprehensive analytics data
 * GET /api/maintenance-logs/analytics
 */
exports.getMaintenanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.performedDate = {};
      if (startDate) dateFilter.performedDate.$gte = new Date(startDate);
      if (endDate) dateFilter.performedDate.$lte = new Date(endDate);
    }
    
    // Get all maintenance logs with equipment
    const logs = await MaintenanceLog.find(dateFilter)
      .populate('equipment', 'equipmentId name type status manufacturer model operatingHours maintenanceInterval')
      .sort({ performedDate: -1 });
    
    // 1. Cost by Equipment Type
    const costByType = {};
    const laborByType = {};
    const partsByType = {};
    const countByType = {};
    
    logs.forEach(log => {
      if (log.equipment && log.equipment.type) {
        const type = log.equipment.type;
        costByType[type] = (costByType[type] || 0) + (log.cost || 0);
        laborByType[type] = (laborByType[type] || 0) + (log.laborCost || 0);
        partsByType[type] = (partsByType[type] || 0) + (log.partsCost || 0);
        countByType[type] = (countByType[type] || 0) + 1;
      }
    });
    
    const costByEquipmentType = Object.keys(costByType).map(type => ({
      type,
      cost: costByType[type],
      laborCost: laborByType[type],
      partsCost: partsByType[type],
      count: countByType[type]
    })).sort((a, b) => b.cost - a.cost);
    
    // 2. Monthly Cost Trend
    const monthlyData = {};
    logs.forEach(log => {
      const month = new Date(log.performedDate).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { cost: 0, laborCost: 0, partsCost: 0, count: 0 };
      }
      monthlyData[month].cost += (log.cost || 0);
      monthlyData[month].laborCost += (log.laborCost || 0);
      monthlyData[month].partsCost += (log.partsCost || 0);
      monthlyData[month].count += 1;
    });
    
    const monthlyCostTrend = Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        ...monthlyData[month]
      }));
    
    // 3. Maintenance Type Distribution
    const typeDistribution = {};
    logs.forEach(log => {
      typeDistribution[log.maintenanceType] = (typeDistribution[log.maintenanceType] || 0) + 1;
    });
    
    const maintenanceTypeDistribution = Object.keys(typeDistribution).map(type => ({
      type,
      count: typeDistribution[type]
    }));
    
    // 4. Top 10 Most Expensive Equipment
    const equipmentCosts = {};
    logs.forEach(log => {
      if (log.equipment) {
        const eqId = log.equipment._id.toString();
        if (!equipmentCosts[eqId]) {
          equipmentCosts[eqId] = {
            equipmentId: log.equipment.equipmentId,
            name: log.equipment.name,
            type: log.equipment.type,
            cost: 0,
            count: 0
          };
        }
        equipmentCosts[eqId].cost += (log.cost || 0);
        equipmentCosts[eqId].count += 1;
      }
    });
    
    const topEquipment = Object.values(equipmentCosts)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
    
    // 5. MTBF (Mean Time Between Failures) by Equipment Type
    const Equipment = require('../models/Equipment');
    const allEquipment = await Equipment.find({});
    
    const mtbfByType = {};
    allEquipment.forEach(eq => {
      if (!mtbfByType[eq.type]) {
        mtbfByType[eq.type] = { totalHours: 0, count: 0, failures: 0 };
      }
      mtbfByType[eq.type].totalHours += eq.operatingHours || 0;
      mtbfByType[eq.type].count += 1;
    });
    
    logs.filter(log => log.maintenanceType === 'emergency' || log.maintenanceType === 'unscheduled')
      .forEach(log => {
        if (log.equipment && mtbfByType[log.equipment.type]) {
          mtbfByType[log.equipment.type].failures += 1;
        }
      });
    
    const mtbfData = Object.keys(mtbfByType).map(type => ({
      type,
      mtbf: mtbfByType[type].failures > 0 
        ? (mtbfByType[type].totalHours / mtbfByType[type].failures).toFixed(0)
        : mtbfByType[type].totalHours.toFixed(0),
      failures: mtbfByType[type].failures
    })).sort((a, b) => b.mtbf - a.mtbf);
    
    // 6. MTTR (Mean Time To Repair) by Equipment Type
    const mttrByType = {};
    logs.forEach(log => {
      if (log.equipment && log.duration) {
        if (!mttrByType[log.equipment.type]) {
          mttrByType[log.equipment.type] = { totalDuration: 0, count: 0 };
        }
        mttrByType[log.equipment.type].totalDuration += log.duration;
        mttrByType[log.equipment.type].count += 1;
      }
    });
    
    const mttrData = Object.keys(mttrByType).map(type => ({
      type,
      mttr: (mttrByType[type].totalDuration / mttrByType[type].count).toFixed(1),
      count: mttrByType[type].count
    })).sort((a, b) => a.mttr - b.mttr);
    
    // 7. Labor vs Parts Cost Summary
    const totalLaborCost = logs.reduce((sum, log) => sum + (log.laborCost || 0), 0);
    const totalPartsCost = logs.reduce((sum, log) => sum + (log.partsCost || 0), 0);
    
    const laborVsParts = [
      { category: 'Labor', cost: totalLaborCost },
      { category: 'Parts', cost: totalPartsCost }
    ];
    
    // 8. Key Performance Indicators
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalEvents = logs.length;
    const avgCost = totalEvents > 0 ? totalCost / totalEvents : 0;
    const avgDuration = logs.filter(l => l.duration).length > 0
      ? logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.filter(l => l.duration).length
      : 0;
    
    // 9. Overdue Maintenance by Equipment Type
    const now = new Date();
    const overdueByType = {};
    
    const upcomingLogs = await MaintenanceLog.find({
      nextDue: { $lt: now, $ne: null }
    }).populate('equipment', 'type');
    
    upcomingLogs.forEach(log => {
      if (log.equipment && log.equipment.type) {
        overdueByType[log.equipment.type] = (overdueByType[log.equipment.type] || 0) + 1;
      }
    });
    
    const overdueData = Object.keys(overdueByType).map(type => ({
      type,
      count: overdueByType[type]
    })).sort((a, b) => b.count - a.count);
    
    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalCost,
          totalEvents,
          avgCost,
          avgDuration,
          totalLaborCost,
          totalPartsCost
        },
        costByEquipmentType,
        monthlyCostTrend,
        maintenanceTypeDistribution,
        topEquipment,
        mtbfData,
        mttrData,
        laborVsParts,
        overdueData
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance analytics'
    });
  }
};

/**
 * Get upcoming maintenance
 * GET /api/maintenance-logs/upcoming
 */
exports.getUpcomingMaintenance = async (req, res) => {
  try {
    const now = new Date();
    const daysAhead = parseInt(req.query.days) || 30;
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const upcoming = await MaintenanceLog.find({
      nextDue: { $gte: now, $lte: futureDate }
    })
      .populate('equipment', 'equipmentId name type status')
      .sort({ nextDue: 1 });
    
    res.status(200).json({
      status: 'success',
      results: upcoming.length,
      data: { logs: upcoming }
    });
  } catch (error) {
    console.error('Error fetching upcoming maintenance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upcoming maintenance'
    });
  }
};
