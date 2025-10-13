const Constant = require('../models/Constant');
const AuditLog = require('../models/AuditLog');

// Helper function to log audit
const logAudit = async (action, entity, entityId, details, userId, ipAddress) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Seed default constants if none exist
const seedDefaultConstants = async (userId) => {
  try {
    const count = await Constant.countDocuments();
    if (count === 0) {
      const defaultConstants = [
        {
          keyword: 'WIDTH',
          value: 5.0,
          unit: 'meters',
          description: 'Standard tunnel/stope width used in volume calculations',
          category: 'Mining',
          createdBy: userId,
          isActive: true
        },
        {
          keyword: 'HEIGHT',
          value: 4.0,
          unit: 'meters',
          description: 'Standard tunnel/stope height used in volume calculations',
          category: 'Mining',
          createdBy: userId,
          isActive: true
        },
        {
          keyword: 'DENSITY',
          value: 2.7,
          unit: 'tonnes/m³',
          description: 'Rock/ore density for converting volume to tonnage',
          category: 'Mining',
          createdBy: userId,
          isActive: true
        }
      ];

      await Constant.insertMany(defaultConstants);
      console.log('Default constants seeded successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error seeding constants:', error);
    return false;
  }
};

// @desc    Get all constants
// @route   GET /api/constants
// @access  Private
exports.getConstants = async (req, res) => {
  try {
    // Seed defaults if none exist
    await seedDefaultConstants(req.user.id);

    const constants = await Constant.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ category: 1, keyword: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        constants,
        count: constants.length
      }
    });
  } catch (error) {
    console.error('Error fetching constants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch constants'
    });
  }
};

// @desc    Get single constant
// @route   GET /api/constants/:id
// @access  Private
exports.getConstant = async (req, res) => {
  try {
    const constant = await Constant.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!constant) {
      return res.status(404).json({
        status: 'error',
        message: 'Constant not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { constant }
    });
  } catch (error) {
    console.error('Error fetching constant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch constant'
    });
  }
};

// @desc    Create new constant
// @route   POST /api/constants
// @access  Private (Admin only)
exports.createConstant = async (req, res) => {
  try {
    const { keyword, value, unit, description, category } = req.body;

    // Validation
    if (!keyword || !value || !unit) {
      return res.status(400).json({
        status: 'error',
        message: 'Keyword, value, and unit are required'
      });
    }

    // Check if keyword already exists
    const existing = await Constant.findOne({ keyword: keyword.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Constant with this keyword already exists'
      });
    }

    const constant = await Constant.create({
      keyword: keyword.toUpperCase(),
      value: parseFloat(value),
      unit,
      description: description || '',
      category: category || 'Mining',
      createdBy: req.user.id
    });

    // Audit log
    await logAudit(
      'CREATE',
      'Constant',
      constant._id,
      `Created constant: ${constant.keyword} = ${constant.value} ${constant.unit}`,
      req.user.id,
      req.ip
    );

    const populatedConstant = await Constant.findById(constant._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Constant created successfully',
      data: { constant: populatedConstant }
    });
  } catch (error) {
    console.error('Error creating constant:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Constant with this keyword already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create constant'
    });
  }
};

// @desc    Update constant
// @route   PUT /api/constants/:id
// @access  Private (Admin only)
exports.updateConstant = async (req, res) => {
  try {
    let constant = await Constant.findById(req.params.id);

    if (!constant) {
      return res.status(404).json({
        status: 'error',
        message: 'Constant not found'
      });
    }

    const { keyword, value, unit, description, category, isActive } = req.body;

    // Store old values for audit
    const oldValues = {
      keyword: constant.keyword,
      value: constant.value,
      unit: constant.unit,
      description: constant.description,
      category: constant.category,
      isActive: constant.isActive
    };

    // Update fields
    if (keyword !== undefined) constant.keyword = keyword.toUpperCase();
    if (value !== undefined) constant.value = parseFloat(value);
    if (unit !== undefined) constant.unit = unit;
    if (description !== undefined) constant.description = description;
    if (category !== undefined) constant.category = category;
    if (isActive !== undefined) constant.isActive = isActive;
    constant.updatedBy = req.user.id;

    await constant.save();

    // Audit log
    const changes = [];
    if (oldValues.keyword !== constant.keyword) changes.push(`keyword: ${oldValues.keyword} → ${constant.keyword}`);
    if (oldValues.value !== constant.value) changes.push(`value: ${oldValues.value} → ${constant.value}`);
    if (oldValues.unit !== constant.unit) changes.push(`unit: ${oldValues.unit} → ${constant.unit}`);
    if (oldValues.isActive !== constant.isActive) changes.push(`isActive: ${oldValues.isActive} → ${constant.isActive}`);

    await logAudit(
      'UPDATE',
      'Constant',
      constant._id,
      `Updated constant: ${changes.join(', ')}`,
      req.user.id,
      req.ip
    );

    const populatedConstant = await Constant.findById(constant._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Constant updated successfully',
      data: { constant: populatedConstant }
    });
  } catch (error) {
    console.error('Error updating constant:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Constant with this keyword already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update constant'
    });
  }
};

// @desc    Delete constant
// @route   DELETE /api/constants/:id
// @access  Private (Admin only)
exports.deleteConstant = async (req, res) => {
  try {
    const constant = await Constant.findById(req.params.id);

    if (!constant) {
      return res.status(404).json({
        status: 'error',
        message: 'Constant not found'
      });
    }

    // Store info for audit before deletion
    const constantInfo = {
      keyword: constant.keyword,
      value: constant.value,
      unit: constant.unit
    };

    await Constant.findByIdAndDelete(req.params.id);

    // Audit log
    await logAudit(
      'DELETE',
      'Constant',
      req.params.id,
      `Deleted constant: ${constantInfo.keyword} = ${constantInfo.value} ${constantInfo.unit}`,
      req.user.id,
      req.ip
    );

    res.status(200).json({
      status: 'success',
      message: 'Constant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting constant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete constant'
    });
  }
};

// @desc    Get constant statistics
// @route   GET /api/constants/stats
// @access  Private
exports.getConstantStats = async (req, res) => {
  try {
    const totalConstants = await Constant.countDocuments();
    const activeConstants = await Constant.countDocuments({ isActive: true });
    const inactiveConstants = await Constant.countDocuments({ isActive: false });

    const byCategory = await Constant.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        total: totalConstants,
        active: activeConstants,
        inactive: inactiveConstants,
        byCategory
      }
    });
  } catch (error) {
    console.error('Error fetching constant stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
};
