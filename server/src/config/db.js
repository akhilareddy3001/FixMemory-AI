import mongoose from 'mongoose';

const PLACEHOLDER_PATTERNS = [
  'placeholder:placeholder',
  '<username>',
  '<password>',
  'cluster.example.mongodb.net',
];

/**
 * Connects to MongoDB Atlas using the MONGO_URI environment variable.
 *
 * Startup will be aborted if MONGO_URI is:
 *   - missing / empty
 *   - still set to the example placeholder value
 *
 * No in-memory or local fallback is provided — MongoDB Atlas is required.
 */
export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // --- Validate URI presence ---
  if (!uri || uri.trim() === '') {
    console.error('\x1b[31m[Database Configuration Error] MONGO_URI is not set in server/.env.\x1b[0m');
    console.error('  Please add a valid MongoDB Atlas connection string to server/.env:');
    console.error('  MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority');
    throw new Error('MONGO_URI is missing. Set a valid MongoDB Atlas connection string in server/.env and restart.');
  }

  // --- Reject placeholder values ---
  const isPlaceholder = PLACEHOLDER_PATTERNS.some((pattern) => uri.includes(pattern));
  if (isPlaceholder) {
    console.error('\x1b[31m[Database Configuration Error] MONGO_URI in server/.env still contains a placeholder value.\x1b[0m');
    console.error('  Replace the placeholder with your real MongoDB Atlas connection string:');
    console.error('  MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority');
    throw new Error('MONGO_URI is a placeholder. Update server/.env with your real MongoDB Atlas URI and restart.');
  }

  // --- Connect to MongoDB Atlas ---
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    const host = conn.connection.host;
    const dbName = conn.connection.name || 'fixmemory';

    console.log('\x1b[32m[Database Connected] MongoDB Atlas connection established successfully.\x1b[0m');
    console.log(`  Host:     ${host}`);
    console.log(`  Database: ${dbName}`);

    return conn;
  } catch (error) {
    // Redact credentials before logging
    const sanitized = error.message.replace(/\/\/([^:]+):([^@]+)@/, '//*****:*****@');
    console.error(`\x1b[31m[Database Connection Error] Failed to connect to MongoDB Atlas: ${sanitized}\x1b[0m`);
    console.error('  Check that your MONGO_URI is correct and your Atlas cluster is accessible.');
    throw new Error(sanitized);
  }
};

/**
 * Gracefully disconnects from MongoDB Atlas.
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database Disconnected] MongoDB connection closed.');
  } catch (error) {
    console.error('[Database Disconnect Error]', error.message);
  }
};

export default connectDB;
