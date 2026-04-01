import * as financialRecordService from '../services/financialRecordService.js';
import { body, validationResult } from 'express-validator';

/**
 * Financial Record Controller - Handles HTTP requests/responses
 * Contains NO business logic - delegates to financialRecordService
 */

/**
 * Validation rules for creating/updating records
 */
export const validateRecord = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO date'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

/**
 * Get all records with filtering
 */
export const getAllRecords = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page, limit, sortBy, sortOrder } =
      req.query;

    const filters = {
      type,
      category,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await financialRecordService.getAllRecords(
      filters,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single record by ID
 */
export const getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await financialRecordService.getRecordById(
      id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new record
 */
export const createRecord = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const record = await financialRecordService.createRecord(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a record
 */
export const updateRecord = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    const record = await financialRecordService.updateRecord(
      id,
      req.body,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a record (soft delete)
 */
export const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await financialRecordService.deleteRecord(
      id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await financialRecordService.getCategories(
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
