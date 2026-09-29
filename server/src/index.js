import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas on startup
    await connectDB();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` FixMemory AI Backend Server running on port ${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`\x1b[31m[Server Startup Failed] Server could not start due to database error.\x1b[0m`);
    console.error(`Details: ${error.message}`);
    // Keep process alive or exit depending on config, but exit with 1 on critical DB failure
    process.exit(1);
  }
};

startServer();
