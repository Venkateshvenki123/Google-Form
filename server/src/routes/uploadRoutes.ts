import { Router } from 'express';
import { uploadSingleFile } from '../controllers/uploadController.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

// File upload can be accessed by public respondents (when form has file upload field) or admin
router.post('/', uploadMiddleware.single('file'), uploadSingleFile);

export default router;
