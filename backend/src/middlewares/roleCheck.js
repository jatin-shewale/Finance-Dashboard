export const checkRolePermission = (action, resource) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permissions = getRolePermissions(userRole);

    // Check if the action is allowed for this role on this resource
    if (!permissions[resource] || !permissions[resource].includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions: ${userRole} cannot ${action} ${resource}`,
      });
    }

    next();
  };
};

/**
 * Define role permissions matrix
 */
const getRolePermissions = (role) => {
  const permissions = {
    viewer: {
      users: ['read:own'], // Can only read own profile
      financialRecords: ['read:own'], // Can only read own records
      dashboard: ['read'],
    },
    analyst: {
      users: ['read:all'], // Can read all users
      financialRecords: ['read:all', 'create'], // Read all + create
      dashboard: ['read'],
    },
    admin: {
      users: ['read:all', 'create', 'update', 'delete'],
      financialRecords: ['read:all', 'create', 'update', 'delete'],
      dashboard: ['read'],
    },
  };

  return permissions[role] || {};
};
