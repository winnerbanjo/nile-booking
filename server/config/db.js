import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Global cache object for Mongoose connection.
 * Prevents multiple connections during Vercel serverless function invocations.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  const localUri = 'mongodb://127.0.0.1:27017/nile_booking_dev';

  if (!uri && isProduction) {
    throw new Error('MONGODB_URI is required in production environment.');
  }

  const effectiveUri = uri || localUri;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };
    cached.promise = mongoose.connect(effectiveUri, opts).then((m) => {
      console.log(`🍃 DATABASE CONNECTED: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ Database Connection Error:', error.message);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
