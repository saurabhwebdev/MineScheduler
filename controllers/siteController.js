const Site = require('../models/Site');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
exports.getSites = async (req, res) => {
  try {
    const { isActive, siteType, search, sort } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Filter by site type
    if (siteType) {
      query.siteType = siteType;
    }
    
    // Search by site ID or name
    if (search) {
      query.$or = [
        { siteId: { $regex: search, $options: 'i' } },
        { siteName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    let sortOption = {};
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      // Default sort: active first, then by priority
      sortOption = { isActive: -1, priority: 1 };
    }
    
    const sites = await Site.find(query).sort(sortOption);
    
    res.status(200).json({
      status: 'success',
      data: { sites }
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sites'
    });
  }
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
exports.getSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        status: 'error',
        message: 'Site not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { site }
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch site'
    });
  }
};

// @desc    Create new site
// @route   POST /api/sites
// @access  Private
exports.createSite = async (req, res) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    const site = await Site.create(req.body);
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'SITE',
      resourceType: 'Site',
      resourceId: site._id,
      resourceName: `${site.siteId} - ${site.siteName}`,
      newValues: site.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(201).json({
      status: 'success',
      data: { site }
    });
  } catch (error) {
    console.error('Error creating site:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Site ID already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create site'
    });
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private
exports.updateSite = async (req, res) => {
  try {
    let site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        status: 'error',
        message: 'Site not found'
      });
    }
    
    // Store old values for audit
    const oldValues = site.toObject();
    
    site = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'SITE',
      resourceType: 'Site',
      resourceId: site._id,
      resourceName: `${site.siteId} - ${site.siteName}`,
      oldValues: oldValues,
      newValues: site.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(200).json({
      status: 'success',
      data: { site }
    });
  } catch (error) {
    console.error('Error updating site:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Site ID already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update site'
    });
  }
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private
exports.deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        status: 'error',
        message: 'Site not found'
      });
    }
    
    await site.deleteOne();
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'SITE',
      resourceType: 'Site',
      resourceId: site._id,
      resourceName: `${site.siteId} - ${site.siteName}`,
      oldValues: site.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(200).json({
      status: 'success',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete site'
    });
  }
};

// @desc    Toggle site active status
// @route   PUT /api/sites/:id/toggle
// @access  Private
exports.toggleSiteStatus = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        status: 'error',
        message: 'Site not found'
      });
    }
    
    const oldStatus = site.isActive;
    site.isActive = !site.isActive;
    await site.save();
    
    // Log audit
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'SITE',
      resourceType: 'Site',
      resourceId: site._id,
      resourceName: `${site.siteId} - ${site.siteName}`,
      oldValues: { isActive: oldStatus },
      newValues: { isActive: site.isActive },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(200).json({
      status: 'success',
      data: { site }
    });
  } catch (error) {
    console.error('Error toggling site status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle site status'
    });
  }
};

// @desc    Import sites from JSON
// @route   POST /api/sites/import
// @access  Private
exports.importSites = async (req, res) => {
  try {
    const { sites } = req.body;
    
    if (!sites || !Array.isArray(sites) || sites.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of sites to import'
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const siteData of sites) {
      try {
        // Add user to site data
        siteData.createdBy = req.user.id;
        
        const site = await Site.create(siteData);
        results.success.push({
          siteId: site.siteId,
          siteName: site.siteName
        });
        
        // Log audit
        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'SITE',
          resourceType: 'Site',
          resourceId: site._id,
          resourceName: `${site.siteId} - ${site.siteName}`,
          newValues: site.toObject(),
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });
      } catch (error) {
        results.failed.push({
          siteId: siteData.siteId || 'Unknown',
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
    console.error('Error importing sites:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import sites'
    });
  }
};

// @desc    Export sites to JSON
// @route   GET /api/sites/export
// @access  Private
exports.exportSites = async (req, res) => {
  try {
    const sites = await Site.find().sort({ priority: 1 });
    
    res.status(200).json({
      status: 'success',
      data: { sites }
    });
  } catch (error) {
    console.error('Error exporting sites:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export sites'
    });
  }
};

// @desc    Get site statistics
// @route   GET /api/sites/stats
// @access  Private
exports.getSiteStats = async (req, res) => {
  try {
    const totalSites = await Site.countDocuments();
    const activeSites = await Site.countDocuments({ isActive: true });
    const inactiveSites = totalSites - activeSites;
    
    const sitesByType = await Site.aggregate([
      {
        $group: {
          _id: '$siteType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalSites,
        activeSites,
        inactiveSites,
        sitesByType
      }
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch site statistics'
    });
  }
};
