import express from 'express';
import { getMemoryOverview } from '../controllers/memoryController.js';

const router = express.Router();

router.get('/overview', getMemoryOverview);
router.get('/', getMemoryOverview);

export default router;
