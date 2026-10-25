import { Router } from 'express';
import { getPublicFormBySlug } from '../controllers/formController.js';
import { submitResponse } from '../controllers/responseController.js';
import { db } from '../config/database.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// List public forms
router.get('/forms', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, slug, title, description, theme, created_at,
              (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id) as response_count
       FROM forms f
       WHERE status = 'published'
       ORDER BY updated_at DESC`
    );
    res.json({ success: true, forms: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single public form schema by slug
router.get('/forms/:slug', getPublicFormBySlug);

// Submit response to public form
router.post('/forms/:slug/submit', submissionLimiter, submitResponse);
router.post('/submit', submissionLimiter, submitResponse);

export default router;
