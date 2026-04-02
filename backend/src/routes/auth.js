import express from 'express';
import {
  register,
  login,
  validateRegister,
} from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', login);

export default router;
