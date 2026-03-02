import mongoose from 'mongoose';
import { seedDemoUser } from '../scripts/seedDemoUser.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nile-booking');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('✅ Database Connected: Nile Booking Engine Active');
    
    // Seed demo user after successful connection
    await seedDemoUser();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
