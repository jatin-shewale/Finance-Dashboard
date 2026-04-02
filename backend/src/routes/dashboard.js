import express from 'express';
import { getSummary, getCategorySummary } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();


router.use(protect); // All routes require authentication

router.get('/summary', getSummary);
router.get('/category-summary', getCategorySummary);

export default router;
