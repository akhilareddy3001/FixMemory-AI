import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor to unwrap standard { success, data, message } envelope
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

// ----------------- HEALTH -----------------
export const checkBackendHealth = () => api.get('/health');

// ----------------- INCIDENTS -----------------
export const getIncidents = (params = {}) => api.get('/incidents', { params });
export const getIncidentById = (id) => api.get(`/incidents/${id}`);
export const createIncident = (data) => api.post('/incidents', data);
export const updateIncidentStatus = (id, status, notes) =>
  api.patch(`/incidents/${id}/status`, { status, notes });
export const addTimelineEvent = (id, eventData) =>
  api.post(`/incidents/${id}/timeline`, eventData);
export const resolveIncident = (id, resolutionData) =>
  api.post(`/incidents/${id}/resolve`, resolutionData);
export const analyzeIncident = (incidentId) =>
  api.post(`/incidents/analyze/${incidentId}`);
export const askFixMemory = (question, incidentId) =>
  api.post('/incidents/ask', { question, incidentId });
export const submitIncidentFeedback = (id, feedbackData) =>
  api.post(`/incidents/${id}/feedback`, feedbackData);

// ----------------- SERVICES -----------------
export const getServices = () => api.get('/services');
export const getServiceById = (id) => api.get(`/services/${id}`);
export const createService = (data) => api.post('/services', data);
export const updateService = (id, data) => api.patch(`/services/${id}`, data);
export const deleteService = (id) => api.delete(`/services/${id}`);

// ----------------- ENGINEERS -----------------
export const getEngineers = (params = {}) => api.get('/engineers', { params });
export const getEngineerById = (id) => api.get(`/engineers/${id}`);
export const createEngineer = (data) => api.post('/engineers', data);
export const updateEngineer = (id, data) => api.patch(`/engineers/${id}`, data);

// ----------------- RUNBOOKS -----------------
export const getRunbooks = (params = {}) => api.get('/runbooks', { params });
export const getRunbookById = (id) => api.get(`/runbooks/${id}`);
export const createRunbook = (data) => api.post('/runbooks', data);
export const matchRunbooks = (error, serviceId) =>
  api.get('/runbooks/match', { params: { error, serviceId } });

// ----------------- ANALYTICS -----------------
export const getAnalyticsOverview = () => api.get('/analytics/overview');

// ----------------- MEMORY -----------------
export const getMemoryOverview = () => api.get('/memory/overview');

// ----------------- SETTINGS & HEALTH -----------------
export const getSettings = () => api.get('/settings');
export const updateSetting = (key, value, description) =>
  api.patch(`/settings/${key}`, { value, description });
export const getSystemHealth = () => api.get('/settings/health');

export default api;
