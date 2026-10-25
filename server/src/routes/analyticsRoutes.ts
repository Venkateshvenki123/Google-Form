import { Router } from 'express';
import { getDashboardStats, getFormAnalytics } from '../controllers/analyticsController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/form/:formId', getFormAnalytics);

export default router;
