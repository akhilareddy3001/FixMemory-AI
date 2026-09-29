import express from 'express';
import {
  getIncidents,
  createIncident,
  getIncidentById,
  updateIncidentStatus,
  addTimelineEvent,
  resolveIncident,
} from '../controllers/incidentController.js';

import {
  analyzeIncident,
  askFixMemory,
  recordIncidentFeedback,
} from '../controllers/agentController.js';
const router = express.Router();

router.route('/')
  .get(getIncidents)
  .post(createIncident);

// Ask FixMemory natural language query
router.post('/ask', askFixMemory);

// Incident analysis and feedback
router.post('/analyze/:incidentId', analyzeIncident);
router.post('/:id/feedback', recordIncidentFeedback);

router.route('/:id')
  .get(getIncidentById);

router.patch('/:id/status', updateIncidentStatus);
router.post('/:id/timeline', addTimelineEvent);
router.post('/:id/resolve', resolveIncident);

export default router;
