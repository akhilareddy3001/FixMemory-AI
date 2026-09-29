import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import incidentRoutes from './routes/incidentRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import engineerRoutes from './routes/engineerRoutes.js';
import runbookRoutes from './routes/runbookRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FixMemory AI backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'FixMemory AI Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      incidents: '/api/incidents',
      services: '/api/services',
      engineers: '/api/engineers',
      runbooks: '/api/runbooks',
      analytics: '/api/analytics/overview',
      settings: '/api/settings',
      memory: '/api/memory/overview',
    },
  });
});

// API Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/runbooks', runbookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/memory', memoryRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const errorMessage = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
