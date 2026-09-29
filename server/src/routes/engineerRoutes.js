import express from 'express';
import {
  getEngineers,
  createEngineer,
  getEngineerById,
  updateEngineer,
} from '../controllers/engineerController.js';

const router = express.Router();

router.route('/')
  .get(getEngineers)
  .post(createEngineer);

router.route('/:id')
  .get(getEngineerById)
  .patch(updateEngineer);

export default router;
