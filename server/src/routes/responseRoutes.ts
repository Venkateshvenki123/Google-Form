import { Router } from 'express';
import {
  listResponses,
  getResponseDetails,
  deleteResponse,
  deleteAllResponsesForForm,
  exportResponses,
} from '../controllers/responseController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// All routes here are admin-protected
router.use(authenticateAdmin);

router.get('/', listResponses);
router.get('/:id', getResponseDetails);
router.delete('/:id', deleteResponse);
router.delete('/form/:formId/all', deleteAllResponsesForForm);
router.get('/export/:formId', exportResponses);

export default router;
