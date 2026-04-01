import FinancialRecord from '../models/FinancialRecord.js';
import { filterRecordsByPermission } from '../policies/financialRecordPolicy.js';

/**
 * Financial Record Service - Contains all business logic for records
 */

/**
 * Create a new financial record
 */
export const createRecord = async (recordData, userId) => {
  const { amount, type, category, date, description } = recordData;

  const record = await FinancialRecord.create({
    amount,
    type,
    category,
    date: date || new Date(),
    description,
    createdBy: userId,
  });

  return record;
};

/**
 * Get all records with filtering and pagination
 */
export const getAllRecords = async (filters = {}, userId, userRole) => {
  const {
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  // Build query
  let query = FinancialRecord.find({ isDeleted: false });

  // Apply permission-based filtering
  query = await filterRecordsByPermission(query, userId, userRole);

  // Apply additional filters
  if (type) query.where({ type });
  if (category) query.where({ category });
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    query.where({ date: dateFilter });
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await FinancialRecord.countDocuments(query.where);

  // Apply sorting
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  query.sort(sortOptions);

  // Execute query with pagination
  const records = await query.skip(skip).limit(parseInt(limit));

  return {
    records,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single record by ID with permission check
 */
export const getRecordById = async (recordId, userId, userRole) => {
  const { allowed, record, message } = await (await import('../policies/financialRecordPolicy.js')).canAccessRecord(
    userId,
    userRole,
    recordId
  );

  if (!allowed) {
    throw { statusCode: 404, message };
  }

  return record;
};

/**
 * Update a record (admin only)
 */
export const updateRecord = async (recordId, updateData, userId, userRole) => {
  // Permission check
  const canUpdate = await (await import('../policies/financialRecordPolicy.js')).canUpdateRecord(userRole);
  if (!canUpdate) {
    throw {
      statusCode: 403,
      message: 'Not authorized to update records',
    };
  }

  const { allowed, record } = await (await import('../policies/financialRecordPolicy.js')).canAccessRecord(
    userId,
    userRole,
    recordId
  );

  if (!allowed || !record) {
    throw { statusCode: 404, message: 'Record not found' };
  }

  // Update fields
  const { amount, type, category, date, description } = updateData;
  const updatedRecord = await FinancialRecord.findByIdAndUpdate(
    recordId,
    { amount, type, category, date, description },
    { new: true, runValidators: true }
  );

  return updatedRecord;
};

/**
 * Delete a record (soft delete - admin only)
 */
export const deleteRecord = async (recordId, userId, userRole) => {
  // Permission check
  const canDelete = await (await import('../policies/financialRecordPolicy.js')).canDeleteRecord(userRole);
  if (!canDelete) {
    throw {
      statusCode: 403,
      message: 'Not authorized to delete records',
    };
  }

  const { allowed, record } = await (await import('../policies/financialRecordPolicy.js')).canAccessRecord(
    userId,
    userRole,
    recordId
  );

  if (!allowed || !record) {
    throw { statusCode: 404, message: 'Record not found' };
  }

  // Soft delete
  const deletedRecord = await FinancialRecord.findByIdAndUpdate(
    recordId,
    { isDeleted: true },
    { new: true }
  );

  return deletedRecord;
};

/**
 * Get available categories (unique categories for filtering)
 */
export const getCategories = async (userId, userRole) => {
  let query = FinancialRecord.find({ isDeleted: false });
  query = await filterRecordsByPermission(query, userId, userRole);

  const categories = await query.distinct('category');
  return categories.sort();
};
