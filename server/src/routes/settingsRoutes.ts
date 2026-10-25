import { Router } from 'express';
import { getGlobalSettings, updateGlobalSettings } from '../controllers/settingsController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Public read for site name/logo/default theme, admin write
router.get('/', getGlobalSettings);
router.put('/', authenticateAdmin, updateGlobalSettings);

export default router;
