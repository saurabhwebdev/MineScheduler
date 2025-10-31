const Equipment = require('../models/Equipment');
const MaintenanceLog = require('../models/MaintenanceLog');
const Schedule = require('../models/Schedule');
const Site = require('../models/Site');
const Task = require('../models/Task');
const Delay = require('../models/Delay');
const moment = require('moment');

/**
 * Get comprehensive dashboard metrics
 * GET /api/dashboard/metrics
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(daysAgo.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Fetch all equipment
    const equipment = await Equipment.find({});
    const total = equipment.length;
    const operational = equipment.filter(eq => eq.status === 'operational').length;
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;
    const outOfService = equipment.filter(eq => eq.status === 'out-of-service').length;
    const overdue = equipment.filter(eq => {
      if (!eq.nextMaintenance) return false;
      return new Date(eq.nextMaintenance) < now;
    }).length;
    const dueSoon = equipment.filter(eq => {
      if (!eq.nextMaintenance) return false;
      const daysUntil = (new Date(eq.nextMaintenance) - now) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 7;
    }).length;

    // Fleet Availability
    const fleetAvailability = {
      operational,
      total,
      percentage: total > 0 ? ((operational / total) * 100).toFixed(1) : 0,
      trend: 0 // We'll calculate trend later if we have historical data
    };

    // Critical Alerts
    const criticalAlerts = {
      count: overdue + outOfService,
      overdue,
      outOfService,
      dueSoon,
      severity: overdue + outOfService > 5 ? 'critical' : overdue + outOfService > 2 ? 'warning' : 'good'
    };

    // Fetch latest schedule for efficiency
    const latestSchedule = await Schedule.findOne().sort({ generatedAt: -1 });
    let scheduleEfficiency = {
      utilization: 0,
      quality: 0,
      taskCompletion: 0,
      conflicts: 0,
      lastGenerated: null
    };

    if (latestSchedule) {
      const gridHours = latestSchedule.gridHours || 24;
      const totalCells = Object.keys(latestSchedule.grid).length * gridHours;
      let scheduledCells = 0;
      
      Object.values(latestSchedule.grid).forEach(row => {
        row.forEach(cell => {
          if (cell && cell !== '') scheduledCells++;
        });
      });

      const utilization = totalCells > 0 ? ((scheduledCells / totalCells) * 100).toFixed(1) : 0;
      const conflicts = latestSchedule.allDelays ? latestSchedule.allDelays.length : 0;
      
      // Calculate quality score (0-100)
      // 40% utilization (optimal 70-90%), 30% no conflicts, 30% task completion
      const utilizationScore = parseFloat(utilization) >= 70 && parseFloat(utilization) <= 90 ? 40 : 
                               parseFloat(utilization) >= 60 ? 30 : 
                               parseFloat(utilization) >= 50 ? 20 : 10;
      const conflictScore = conflicts === 0 ? 30 : conflicts <= 5 ? 20 : conflicts <= 10 ? 10 : 0;
      const taskCompletionScore = 30; // Assume 100% for now (would need task completion tracking)
      
      scheduleEfficiency = {
        utilization: parseFloat(utilization),
        quality: utilizationScore + conflictScore + taskCompletionScore,
        taskCompletion: 100,
        conflicts,
        lastGenerated: latestSchedule.generatedAt
      };
    }

    // Maintenance Cost (current period)
    const currentPeriodLogs = await MaintenanceLog.find({
      performedDate: { $gte: daysAgo, $lte: now }
    });
    
    const currentCost = currentPeriodLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const currentLaborCost = currentPeriodLogs.reduce((sum, log) => sum + (log.laborCost || 0), 0);
    const currentPartsCost = currentPeriodLogs.reduce((sum, log) => sum + (log.partsCost || 0), 0);
    
    // Previous period for trend
    const previousPeriodLogs = await MaintenanceLog.find({
      performedDate: { $gte: previousPeriodStart, $lt: daysAgo }
    });
    
    const previousCost = previousPeriodLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const costTrend = previousCost > 0 ? (((currentCost - previousCost) / previousCost) * 100).toFixed(1) : 0;

    const maintenanceCost = {
      total: currentCost,
      laborCost: currentLaborCost,
      partsCost: currentPartsCost,
      trend: parseFloat(costTrend),
      period: days,
      previousPeriod: previousCost
    };

    // Active Operations
    const sites = await Site.find({});
    const tasks = await Task.find({});
    const activeSites = sites.filter(s => s.isActive).length;
    
    // Get delay counts by type
    const userDelays = latestSchedule && latestSchedule.delayedSlots ? latestSchedule.delayedSlots.length : 0;
    const shiftDelays = latestSchedule && latestSchedule.shiftChangeoverDelays ? latestSchedule.shiftChangeoverDelays.length : 0;
    const allDelays = latestSchedule && latestSchedule.allDelays ? latestSchedule.allDelays.length : 0;
    
    const activeOperations = {
      activeSites,
      totalSites: sites.length,
      totalTasks: tasks.length,
      delays: allDelays,
      userDelays: userDelays,
      shiftDelays: shiftDelays,
      allDelays: allDelays
    };

    res.status(200).json({
      status: 'success',
      data: {
        fleetAvailability,
        criticalAlerts,
        scheduleEfficiency,
        maintenanceCost,
        activeOperations,
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard metrics'
    });
  }
};

/**
 * Get dashboard trends and historical data
 * GET /api/dashboard/trends
 */
exports.getDashboardTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get maintenance logs for the period
    const logs = await MaintenanceLog.find({
      performedDate: { $gte: startDate, $lte: now }
    }).populate('equipment', 'type');

    // Cost trend by day
    const costByDay = {};
    logs.forEach(log => {
      const day = moment(log.performedDate).format('YYYY-MM-DD');
      if (!costByDay[day]) {
        costByDay[day] = { cost: 0, laborCost: 0, partsCost: 0, count: 0 };
      }
      costByDay[day].cost += (log.cost || 0);
      costByDay[day].laborCost += (log.laborCost || 0);
      costByDay[day].partsCost += (log.partsCost || 0);
      costByDay[day].count += 1;
    });

    const costTrend = Object.keys(costByDay)
      .sort()
      .map(day => ({
        date: day,
        ...costByDay[day]
      }));

    // Cost by equipment type
    const costByType = {};
    logs.forEach(log => {
      if (log.equipment && log.equipment.type) {
        const type = log.equipment.type;
        if (!costByType[type]) {
          costByType[type] = { cost: 0, laborCost: 0, partsCost: 0, count: 0 };
        }
        costByType[type].cost += (log.cost || 0);
        costByType[type].laborCost += (log.laborCost || 0);
        costByType[type].partsCost += (log.partsCost || 0);
        costByType[type].count += 1;
      }
    });

    const costByEquipmentType = Object.keys(costByType).map(type => ({
      type,
      ...costByType[type]
    })).sort((a, b) => b.cost - a.cost);

    // Equipment status distribution over time (last 7 days)
    const equipment = await Equipment.find({});
    const statusByDay = {};
    
    for (let i = 0; i < 7; i++) {
      const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
      statusByDay[day] = {
        operational: 0,
        maintenance: 0,
        outOfService: 0
      };
    }

    // Current status (we'd need historical tracking for actual historical data)
    const currentDay = moment().format('YYYY-MM-DD');
    equipment.forEach(eq => {
      if (statusByDay[currentDay]) {
        if (eq.status === 'operational') statusByDay[currentDay].operational++;
        else if (eq.status === 'maintenance') statusByDay[currentDay].maintenance++;
        else if (eq.status === 'out-of-service') statusByDay[currentDay].outOfService++;
      }
    });

    const equipmentStatusTrend = Object.keys(statusByDay)
      .sort()
      .map(day => ({
        date: day,
        ...statusByDay[day]
      }));

    // Delay analysis by category
    const latestSchedule = await Schedule.findOne().sort({ generatedAt: -1 });
    let delaysByCategory = [];
    
    if (latestSchedule && latestSchedule.allDelays) {
      const delays = await Delay.find({ isActive: true });
      const delayMap = {};
      
      delays.forEach(delay => {
        // Map both delayCode and code field to category
        if (delay.delayCode) delayMap[delay.delayCode] = delay.delayCategory;
        if (delay.code) delayMap[delay.code] = delay.delayCategory;
      });

      const categoryCount = {};
      latestSchedule.allDelays.forEach(delay => {
        // Try to get category using delayCode or code field
        const category = delayMap[delay.delayCode] || delayMap[delay.code] || delay.category || 'Uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      delaysByCategory = Object.keys(categoryCount).map(category => ({
        category,
        count: categoryCount[category]
      })).sort((a, b) => b.count - a.count);
    }

    res.status(200).json({
      status: 'success',
      data: {
        costTrend,
        costByEquipmentType,
        equipmentStatusTrend,
        delaysByCategory,
        period: days
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard trends'
    });
  }
};

/**
 * Get equipment performance data for 24-hour timeline
 * GET /api/dashboard/equipment-performance
 */
exports.getEquipmentPerformance = async (req, res) => {
  try {
    const equipment = await Equipment.find({});
    const latestSchedule = await Schedule.findOne().sort({ generatedAt: -1 });
    
    const performance = [];
    const gridHours = latestSchedule ? (latestSchedule.gridHours || 24) : 24;
    
    for (let hour = 0; hour < gridHours; hour++) {
      let utilization = 0;
      
      if (latestSchedule && latestSchedule.hourlyAllocation && latestSchedule.hourlyAllocation[hour]) {
        const hourData = latestSchedule.hourlyAllocation[hour];
        const used = Object.values(hourData).reduce((sum, count) => sum + count, 0);
        const limits = latestSchedule.taskLimits || {};
        const totalCapacity = Object.values(limits).reduce((sum, limit) => sum + limit, 0);
        utilization = totalCapacity > 0 ? ((used / totalCapacity) * 100).toFixed(0) : 0;
      }
      
      performance.push({
        hour: hour + 1,
        operational: equipment.filter(eq => eq.status === 'operational').length,
        maintenance: equipment.filter(eq => eq.status === 'maintenance').length,
        outOfService: equipment.filter(eq => eq.status === 'out-of-service').length,
        utilization: parseFloat(utilization)
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { performance }
    });
  } catch (error) {
    console.error('Error fetching equipment performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch equipment performance'
    });
  }
};

/**
 * Get critical alerts count for header notification
 * GET /api/dashboard/critical-alerts
 */
exports.getCriticalAlertsCount = async (req, res) => {
  try {
    const now = new Date();
    
    // Fetch all equipment
    const equipment = await Equipment.find({});
    
    // Calculate critical metrics
    const overdue = equipment.filter(eq => {
      if (!eq.nextMaintenance) return false;
      return new Date(eq.nextMaintenance) < now;
    }).length;
    
    const outOfService = equipment.filter(eq => eq.status === 'out-of-service').length;
    
    const dueSoon = equipment.filter(eq => {
      if (!eq.nextMaintenance) return false;
      const daysUntil = (new Date(eq.nextMaintenance) - now) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 7;
    }).length;
    
    const total = overdue + outOfService;
    
    res.status(200).json({
      status: 'success',
      data: {
        count: total,
        overdue,
        outOfService,
        dueSoon,
        severity: total > 5 ? 'critical' : total > 2 ? 'warning' : 'good'
      }
    });
  } catch (error) {
    console.error('Error fetching critical alerts count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch critical alerts count'
    });
  }
};
