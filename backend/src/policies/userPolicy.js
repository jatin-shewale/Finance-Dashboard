import User from '../models/User.js';

export const canAccessUser = async (currentUserId, currentUserRole, targetUserId) => {
  // Admin can access any user
  if (currentUserRole === 'admin') {
    return { allowed: true };
  }

  // Users can only access their own profile
  if (currentUserId.toString() === targetUserId.toString()) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: 'Not authorized to access this user data',
  };
};

/**
 * Check if user can modify role
 */
export const canModifyRole = (currentUserRole, targetUserRole) => {
  // Admin can modify any role except another admin (for safety)
  if (currentUserRole === 'admin') {
    if (targetUserRole === 'admin') {
      return {
        allowed: false,
        message: 'Cannot modify another admin\'s role',
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    message: 'Only admins can modify user roles',
  };
};

/**
 * Check if user can deactivate/activate a user
 */
export const canChangeStatus = (currentUserRole) => {
  // Only admin can change user status
  return currentUserRole === 'admin';
};
