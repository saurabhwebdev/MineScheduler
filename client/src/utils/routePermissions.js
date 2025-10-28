// Available routes in the application
export const availableRoutes = [
  { path: '/dashboard', label: 'Dashboard', adminOnly: false },
  { path: '/schedule', label: 'Schedule', adminOnly: false },
  { path: '/tasks', label: 'Tasks', adminOnly: false },
  { path: '/delays', label: 'Delays', adminOnly: false },
  { path: '/sites', label: 'Sites', adminOnly: false },
  { path: '/equipment', label: 'Equipment', adminOnly: false },
  { path: '/maintenance-logs', label: 'Maintenance Logs', adminOnly: false },
  { path: '/settings', label: 'Settings', adminOnly: false },
  { path: '/help', label: 'Help', adminOnly: false },
  { path: '/users', label: 'User Management', adminOnly: true },
  { path: '/audit', label: 'Audit', adminOnly: true },
];

/**
 * Check if user has permission to access a route
 * @param {Object} user - User object with role and customRole
 * @param {string} routePath - Route path to check (e.g., '/dashboard')
 * @returns {boolean} - True if user has permission
 */
export const hasRoutePermission = (user, routePath) => {
  if (!user) return false;

  // Profile page is accessible to all authenticated users
  if (routePath === '/profile') return true;

  // Admin users have access to everything
  if (user.role === 'admin') return true;

  // Find the route configuration
  const route = availableRoutes.find(r => r.path === routePath);
  if (!route) return false;

  // If route is admin-only and user is not admin, deny
  if (route.adminOnly && user.role !== 'admin') return false;

  // Users with custom roles - check their permissions
  if (user.customRole && user.customRole.permissions) {
    return user.customRole.permissions.includes(routePath);
  }

  // Regular users without custom role have access to non-admin routes
  if (user.role === 'user' && !route.adminOnly) return true;

  return false;
};

/**
 * Get the first route the user has permission to access
 * @param {Object} user - User object with role and customRole
 * @returns {string} - First permitted route path
 */
export const getFirstPermittedRoute = (user) => {
  if (!user) return '/login';

  // Admin users - default to dashboard
  if (user.role === 'admin') return '/dashboard';

  // Users with custom role - get first permitted route
  if (user.customRole && user.customRole.permissions && user.customRole.permissions.length > 0) {
    // Return the first permitted route from their custom role
    return user.customRole.permissions[0];
  }

  // Regular users without custom role - default to dashboard
  return '/dashboard';
};

/**
 * Get all routes the user has permission to access
 * @param {Object} user - User object with role and customRole
 * @returns {Array} - Array of permitted route paths
 */
export const getPermittedRoutes = (user) => {
  if (!user) return [];

  // Admin users see everything
  if (user.role === 'admin') {
    return availableRoutes.map(r => r.path);
  }

  // Users with custom role
  if (user.customRole && user.customRole.permissions) {
    return user.customRole.permissions;
  }

  // Regular users see non-admin routes
  return availableRoutes.filter(r => !r.adminOnly).map(r => r.path);
};
