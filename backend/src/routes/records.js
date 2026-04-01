import express from 'express';
import {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getCategories,
  validateRecord,
} from '../controllers/financialRecordController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Financial Record routes (protected)
 */
router.use(protect); // All routes require authentication

// Public read access for authenticated users
router.get('/', getAllRecords);
router.get('/categories', getCategories);
router.get('/:id', getRecordById);

// Create record - Admin only
router.post('/', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can create records',
    });
  }
  next();
}, validateRecord, createRecord);

// Update record - Admin only
router.put('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can update records',
    });
  }
  next();
}, validateRecord, updateRecord);

// Delete record - Admin only (soft delete)
router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can delete records',
    });
  }
  next();
}, deleteRecord);

export default router;
