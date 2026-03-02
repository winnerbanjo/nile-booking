import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import bcrypt from 'bcryptjs';

/**
 * Seed Demo User
 * Creates a demo user "The Modern Barber" for testing
 */
export const seedDemoUser = async () => {
  try {
    const demoEmail = 'barber@nile.ng';
    
    // Check if demo user already exists
    const existingUser = await User.findOne({ email: demoEmail });
    
    if (existingUser) {
      console.log('✅ Demo user already exists:', demoEmail);
      return existingUser;
    }

    // Create demo user (password will be hashed by User model's pre-save hook with salt rounds of 10)
    const demoUser = await User.create({
      name: 'The Modern Barber',
      email: demoEmail,
      password: 'password123',
      role: 'provider',
      businessName: 'The Modern Barber',
      slug: 'the-modern-barber',
      phone: '+234 812 345 6789',
      address: {
        city: 'Lagos',
        country: 'Nigeria',
      },
      notificationPreferences: {
        whatsappEnabled: true,
        emailEnabled: true,
        whatsappReminders: true,
        emailReceipts: true,
      },
    });

    // Create default schedule for demo user
    const existingSchedule = await Schedule.findOne({ provider: demoUser._id });
    
    if (!existingSchedule) {
      await Schedule.create({
        provider: demoUser._id,
        weeklySchedule: {
          monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] },
          saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
          sunday: { enabled: false, timeSlots: [] },
        },
        bufferTime: 15,
      });
    }

    console.log('✅ Demo user created successfully:');
    console.log(`   Email: ${demoEmail}`);
    console.log(`   Password: password123`);
    console.log(`   Business: The Modern Barber`);
    console.log(`   Location: Lagos, Nigeria`);

    return demoUser;
  } catch (error) {
    console.error('❌ Error seeding demo user:', error.message);
    // Don't throw - allow server to continue even if seeding fails
    return null;
  }
};
