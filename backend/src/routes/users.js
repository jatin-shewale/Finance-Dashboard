import express from 'express';
import {
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

/**
 * User routes (protected)
 */
router.use(protect); // All routes require authentication

// Get current user profile
router.get('/me', getMe);

// Admin-only routes
router.use(restrictTo('admin')); // Only admin can access routes below

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.post('/:id/deactivate', deactivateUser);
router.post('/:id/activate', activateUser);

export default router;
