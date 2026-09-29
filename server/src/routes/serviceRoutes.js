import express from 'express';
import {
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';

const router = express.Router();

router.route('/')
  .get(getServices)
  .post(createService);

router.route('/:id')
  .get(getServiceById)
  .patch(updateService)
  .delete(deleteService);

export default router;
