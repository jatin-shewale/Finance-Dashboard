import FinancialRecord from '../models/FinancialRecord.js';

/**
 * Check if user can access a specific financial record
 * Implements soft delete filter and ownership checks
 */
export const canAccessRecord = async (userId, userRole, recordId) => {
  const record = await FinancialRecord.findOne({
    _id: recordId,
    isDeleted: false,
  });

  if (!record) {
    return { allowed: false, message: 'Record not found' };
  }

  // Admin can access all records
  if (userRole === 'admin') {
    return { allowed: true, record };
  }

  // Analyst and Viewer can only access their own records
  if (record.createdBy.toString() !== userId.toString()) {
    return { allowed: false, message: 'Not authorized to access this record' };
  }

  return { allowed: true, record };
};

/**
 * Check if user can create a record
 */
export const canCreateRecord = (userRole) => {
  // Only admin can create records (as per requirements)
  // Analyst might also be allowed based on requirement adjustment
  return ['admin'].includes(userRole);
};

/**
 * Check if user can update a record
 */
export const canUpdateRecord = (userRole) => {
  // Only admin can update
  return ['admin'].includes(userRole);
};

/**
 * Check if user can delete a record
 */
export const canDeleteRecord = (userRole) => {
  // Only admin can delete
  return ['admin'].includes(userRole);
};

/**
 * Filter records based on user role and permissions
 */
export const filterRecordsByPermission = async (query, userId, userRole) => {
  // Admin can see all records
  if (userRole === 'admin') {
    return query;
  }

  // Analyst and Viewer can only see their own records
  query.where({ createdBy: userId });
  return query;
};
