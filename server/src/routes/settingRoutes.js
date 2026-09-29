import express from 'express';
import { getSettings, updateSetting, getSystemHealth } from '../controllers/settingController.js';

const router = express.Router();

router.get('/health', getSystemHealth);
router.get('/', getSettings);
router.patch('/:key', updateSetting);

export default router;
