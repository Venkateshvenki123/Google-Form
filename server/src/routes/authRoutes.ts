import { Router } from 'express';
import { login, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.get('/me', authenticateAdmin, getMe);
router.put('/profile', authenticateAdmin, updateProfile);

export default router;
