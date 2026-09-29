import express from 'express';
import {
  getRunbooks,
  createRunbook,
  matchRunbookByError,
  getRunbookById,
  updateRunbook,
  deleteRunbook,
} from '../controllers/runbookController.js';

const router = express.Router();

router.route('/')
  .get(getRunbooks)
  .post(createRunbook);

// Match route before dynamic id parameter
router.get('/match', matchRunbookByError);

router.route('/:id')
  .get(getRunbookById)
  .patch(updateRunbook)
  .delete(deleteRunbook);

export default router;
