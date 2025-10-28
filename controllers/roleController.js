const Role = require('../models/Role');
const User = require('../models/User');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin only)
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('createdBy', 'name email')
      .sort({ isCustom: 1, name: 1 }); // Default roles first, then custom

    // Count users for each role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ customRole: role._id });
        return {
          ...role.toObject(),
          userCount
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        roles: rolesWithUserCount,
        count: rolesWithUserCount.length
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch roles'
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private (Admin only)
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Role not found'
      });
    }

    // Get users with this role
    const users = await User.find({ customRole: role._id })
      .select('name email')
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: { 
        role,
        users
      }
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch role'
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (Admin only)
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validation
    if (!name || !permissions || permissions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and at least one permission are required'
      });
    }

    // Check if role already exists
    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Role with this name already exists'
      });
    }

    const role = await Role.create({
      name: name.trim(),
      description: description || '',
      permissions,
      isCustom: true,
      createdBy: req.user.id
    });

    // Audit log
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'ROLE',
      resourceType: 'Role',
      resourceId: role._id,
      resourceName: role.name,
      newValues: role.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    const populatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Role created successfully',
      data: { role: populatedRole }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Role with this name already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create role'
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (Admin only)
exports.updateRole = async (req, res) => {
  try {
    let role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Role not found'
      });
    }

    // Prevent editing default roles (admin, user)
    if (!role.isCustom) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot edit default system roles'
      });
    }

    const { name, description, permissions } = req.body;

    // Store old values for audit
    const oldValues = {
      name: role.name,
      description: role.description,
      permissions: role.permissions
    };

    // Update fields
    if (name !== undefined) role.name = name.trim();
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();

    // Audit log
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      module: 'ROLE',
      resourceType: 'Role',
      resourceId: role._id,
      resourceName: role.name,
      oldValues: oldValues,
      newValues: role.toObject(),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    const populatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Role updated successfully',
      data: { role: populatedRole }
    });
  } catch (error) {
    console.error('Error updating role:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Role with this name already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update role'
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (Admin only)
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        status: 'error',
        message: 'Role not found'
      });
    }

    // Prevent deleting default roles
    if (!role.isCustom) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete default system roles'
      });
    }

    // Check if any users have this role
    const userCount = await User.countDocuments({ customRole: role._id });
    if (userCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete role. ${userCount} user(s) are assigned to this role. Please reassign them first.`
      });
    }

    // Store info for audit before deletion
    const roleInfo = {
      name: role.name,
      permissions: role.permissions
    };

    await Role.findByIdAndDelete(req.params.id);

    // Audit log
    await logAudit({
      user: req.user,
      action: 'DELETE',
      module: 'ROLE',
      resourceType: 'Role',
      resourceId: req.params.id,
      resourceName: roleInfo.name,
      oldValues: roleInfo,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.status(200).json({
      status: 'success',
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete role'
    });
  }
};

// @desc    Get available routes for permissions
// @route   GET /api/roles/available-routes
// @access  Private (Admin only)
exports.getAvailableRoutes = async (req, res) => {
  try {
    const routes = [
      { path: '/dashboard', label: 'Dashboard', icon: 'HomeOutlined' },
      { path: '/schedule', label: 'Schedule', icon: 'CalendarOutlined' },
      { path: '/tasks', label: 'Tasks', icon: 'FileTextOutlined' },
      { path: '/delays', label: 'Delays', icon: 'ClockCircleOutlined' },
      { path: '/sites', label: 'Sites', icon: 'EnvironmentOutlined' },
      { path: '/equipment', label: 'Equipment', icon: 'ToolOutlined' },
      { path: '/maintenance-logs', label: 'Maintenance Logs', icon: 'HistoryOutlined' },
      { path: '/settings', label: 'Settings', icon: 'SettingOutlined' },
      { path: '/help', label: 'Help', icon: 'QuestionCircleOutlined' },
      { path: '/users', label: 'User Management', icon: 'UserOutlined', adminOnly: true },
      { path: '/audit', label: 'Audit Logs', icon: 'AuditOutlined', adminOnly: true }
    ];

    res.status(200).json({
      status: 'success',
      data: { routes }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available routes'
    });
  }
};
