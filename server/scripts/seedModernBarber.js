import User from '../models/User.js';
import Service from '../models/Service.js';
import Schedule from '../models/Schedule.js';
import mongoose from 'mongoose';

/**
 * Comprehensive Seed Script for "The Modern Barber"
 * Creates demo user with services, gallery images, and social handles
 */
export const seedModernBarber = async () => {
  try {
    const demoEmail = 'barber@nile.ng';
    const slug = 'the-modern-barber';
    
    // Check if demo user already exists
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      // Create demo user
      demoUser = await User.create({
        name: 'The Modern Barber',
        email: demoEmail,
        password: 'password123',
        role: 'provider',
        businessName: 'The Modern Barber',
        slug: slug,
        phone: '+234 812 345 6789',
        bio: 'Premium barbershop specializing in modern cuts, beard grooming, and classic styles. Located in the heart of Lagos.',
        location: 'Lagos, Nigeria',
        address: {
          street: '123 Victoria Island',
          city: 'Lagos',
          country: 'Nigeria',
          zipCode: '101001',
        },
        profileImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop',
        // Social handles for flyer generator
        socialHandles: {
          instagram: '@themodernbarber',
          twitter: '@themodernbarber',
          facebook: 'TheModernBarber',
        },
        // Gallery images
        gallery: [
          {
            url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
            alt: 'Modern fade haircut',
          },
          {
            url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
            alt: 'Beard trim service',
          },
          {
            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
            alt: 'Classic haircut',
          },
          {
            url: 'https://images.unsplash.com/photo-1622296242080-9d53b0b0c0a4?w=800&h=600&fit=crop',
            alt: 'Barbershop interior',
          },
          {
            url: 'https://images.unsplash.com/photo-1582095133170-a5e5c5c5c5c5?w=800&h=600&fit=crop',
            alt: 'Professional styling',
          },
          {
            url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
            alt: 'Customer satisfaction',
          },
        ],
        // Testimonials
        testimonials: [
          {
            name: 'James Adebayo',
            rating: 5,
            comment: 'Best barbershop in Lagos! The Modern Barber gave me the perfect fade. Professional service and great atmosphere.',
            date: new Date('2024-01-15'),
          },
          {
            name: 'Michael Okafor',
            rating: 5,
            comment: 'Outstanding experience! The team is skilled, friendly, and always delivers exactly what I want. Highly recommended!',
            date: new Date('2024-01-20'),
          },
          {
            name: 'David Chukwu',
            rating: 5,
            comment: 'Premium quality cuts every time. The attention to detail is unmatched. This is my go-to spot for all my grooming needs.',
            date: new Date('2024-02-01'),
          },
        ],
        notificationPreferences: {
          whatsappEnabled: true,
          emailEnabled: true,
          whatsappReminders: true,
          emailReceipts: true,
        },
      });
      
      console.log('✅ Demo user created:', demoEmail);
    } else {
      // Update existing user with social handles, gallery, and testimonials
      demoUser.socialHandles = {
        instagram: '@themodernbarber',
        twitter: '@themodernbarber',
        facebook: 'TheModernBarber',
      };
      demoUser.gallery = [
        {
          url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
          alt: 'Modern fade haircut',
        },
        {
          url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
          alt: 'Beard trim service',
        },
        {
          url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
          alt: 'Classic haircut',
        },
        {
          url: 'https://images.unsplash.com/photo-1622296242080-9d53b0b0c0a4?w=800&h=600&fit=crop',
          alt: 'Barbershop interior',
        },
        {
          url: 'https://images.unsplash.com/photo-1582095133170-a5e5c5c5c5c5?w=800&h=600&fit=crop',
          alt: 'Professional styling',
        },
        {
          url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
          alt: 'Customer satisfaction',
        },
      ];
      demoUser.testimonials = [
        {
          name: 'James Adebayo',
          rating: 5,
          comment: 'Best barbershop in Lagos! The Modern Barber gave me the perfect fade. Professional service and great atmosphere.',
          date: new Date('2024-01-15'),
        },
        {
          name: 'Michael Okafor',
          rating: 5,
          comment: 'Outstanding experience! The team is skilled, friendly, and always delivers exactly what I want. Highly recommended!',
          date: new Date('2024-01-20'),
        },
        {
          name: 'David Chukwu',
          rating: 5,
          comment: 'Premium quality cuts every time. The attention to detail is unmatched. This is my go-to spot for all my grooming needs.',
          date: new Date('2024-02-01'),
        },
      ];
      await demoUser.save();
      console.log('✅ Demo user updated with social handles, gallery, and testimonials');
    }

    // Delete existing services for this provider
    await Service.deleteMany({ provider: demoUser._id });
    console.log('✅ Cleared existing services');

    // Create services
    const services = [
      {
        provider: demoUser._id,
        name: 'Skin Fade',
        description: 'Premium skin fade haircut with precision detailing. Perfect for a sharp, modern look.',
        category: 'other',
        price: 5000,
        duration: 0.75, // 45 minutes
        capacity: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
            alt: 'Skin fade haircut',
          },
        ],
        features: ['Precision Cut', 'Hot Towel', 'Hair Styling'],
        isActive: true,
        rating: {
          average: 4.9,
          count: 45,
        },
      },
      {
        provider: demoUser._id,
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping. Includes hot towel treatment and beard oil.',
        category: 'other',
        price: 3000,
        duration: 0.5, // 30 minutes
        capacity: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
            alt: 'Beard trim',
          },
        ],
        features: ['Beard Shaping', 'Hot Towel', 'Beard Oil'],
        isActive: true,
        rating: {
          average: 4.8,
          count: 32,
        },
      },
      {
        provider: demoUser._id,
        name: 'Classic Cut',
        description: 'Traditional classic haircut with modern techniques. Timeless style for any occasion.',
        category: 'other',
        price: 4000,
        duration: 0.75, // 45 minutes
        capacity: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
            alt: 'Classic haircut',
          },
        ],
        features: ['Classic Style', 'Hair Wash', 'Styling'],
        isActive: true,
        rating: {
          average: 4.7,
          count: 28,
        },
      },
      {
        provider: demoUser._id,
        name: 'Full Service',
        description: 'Complete grooming package: haircut, beard trim, hot towel, and styling. The ultimate experience.',
        category: 'other',
        price: 8000,
        duration: 1.5, // 90 minutes
        capacity: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1622296242080-9d53b0b0c0a4?w=800&h=600&fit=crop',
            alt: 'Full service',
          },
        ],
        features: ['Haircut', 'Beard Trim', 'Hot Towel', 'Styling', 'Beard Oil'],
        isActive: true,
        rating: {
          average: 5.0,
          count: 18,
        },
      },
      {
        provider: demoUser._id,
        name: 'Line Up',
        description: 'Precise edge-up and line work. Perfect for maintaining your look between full cuts.',
        category: 'other',
        price: 2500,
        duration: 0.5, // 30 minutes
        capacity: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1582095133170-a5e5c5c5c5c5?w=800&h=600&fit=crop',
            alt: 'Line up',
          },
        ],
        features: ['Edge Up', 'Line Work', 'Quick Service'],
        isActive: true,
        rating: {
          average: 4.6,
          count: 22,
        },
      },
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`✅ Created ${createdServices.length} services`);

    // Create or update schedule
    const existingSchedule = await Schedule.findOne({ provider: demoUser._id });
    
    if (!existingSchedule) {
      await Schedule.create({
        provider: demoUser._id,
        weeklySchedule: {
          monday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          tuesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          wednesday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          thursday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          friday: { enabled: true, timeSlots: [{ startTime: '09:00', endTime: '18:00' }] },
          saturday: { enabled: true, timeSlots: [{ startTime: '10:00', endTime: '16:00' }] },
          sunday: { enabled: false, timeSlots: [] },
        },
        bufferTime: 15,
      });
      console.log('✅ Schedule created');
    } else {
      console.log('✅ Schedule already exists');
    }

    console.log('\n✅ The Modern Barber demo data seeded successfully!');
    console.log(`   Email: ${demoEmail}`);
    console.log(`   Password: password123`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Services: ${createdServices.length}`);
    console.log(`   Gallery Images: ${demoUser.gallery?.length || 0}`);
    console.log(`   Testimonials: ${demoUser.testimonials?.length || 0}`);
    console.log(`   Instagram: ${demoUser.socialHandles?.instagram || 'N/A'}`);
    console.log(`   Twitter: ${demoUser.socialHandles?.twitter || 'N/A'}`);

    return demoUser;
  } catch (error) {
    console.error('❌ Error seeding The Modern Barber:', error.message);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nile-booking')
    .then(() => {
      console.log('Connected to MongoDB');
      return seedModernBarber();
    })
    .then(() => {
      console.log('Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
