import { Router } from 'express';
import {
  listForms,
  getFormById,
  createForm,
  updateForm,
  duplicateForm,
  deleteForm,
  togglePublishForm,
  checkSlugAvailability,
} from '../controllers/formController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// All routes here are admin-protected
router.use(authenticateAdmin);

router.get('/', listForms);
router.post('/', createForm);
router.get('/check-slug', checkSlugAvailability);
router.get('/:id', getFormById);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);
router.post('/:id/duplicate', duplicateForm);
router.patch('/:id/toggle-publish', togglePublishForm);

export default router;
