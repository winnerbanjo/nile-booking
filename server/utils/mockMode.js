// Mock mode state management
// Shared between server.js and controllers

let MOCK_MODE = false;
const mockUsers = new Map();
const mockSchedules = new Map();
const mockServices = [];
const mockStaff = [
  {
    _id: 'staff_1',
    merchant: 'mock_user_barber_id_123',
    name: 'Sammy Fade Specialist',
    email: 'sammy@barber.ng',
    password: 'staff123',
    roleTitle: 'Senior Barber',
    phone: '+234 812 000 1111',
    assignedServices: ['Skin Fade', 'Beard Trim & Shape'],
    isActive: true,
  },
  {
    _id: 'staff_2',
    merchant: 'mock_user_barber_id_123',
    name: 'Victor Stylist',
    email: 'victor@barber.ng',
    password: 'staff123',
    roleTitle: 'Master Stylist',
    phone: '+234 812 000 2222',
    assignedServices: ['Full Grooming Package'],
    isActive: true,
  },
];

export { MOCK_MODE, mockUsers, mockSchedules, mockServices, mockStaff };

const initializeMockData = () => {
  const barberUser = {
    _id: 'mock_user_barber_id_123',
    name: 'The Modern Barber',
    email: 'barber@nile.ng',
    password: 'password123',
    role: 'provider',
    businessName: 'The Modern Barber',
    slug: 'the-modern-barber',
    phone: '+234 812 345 6789',
    bio: 'Premium barbershop specializing in modern cuts, beard grooming, and classic styles.',
    location: 'Lagos, Nigeria',
    profileImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop',
    logo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=150&h=150&fit=crop',
    headerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop',
    address: {
      street: '123 Victoria Island',
      city: 'Lagos',
      country: 'Nigeria',
      zipCode: '101001',
    },
    socialHandles: {
      instagram: '@themodernbarber',
      whatsapp: '+2348123456789',
      twitter: '@themodernbarber',
      facebook: 'TheModernBarber',
    },
    policies: {
      terms: 'All appointments require confirmation. Please arrive 5 minutes before your scheduled slot.',
      returnPolicy: 'Services are non-refundable. Appointment reschedules are permitted up to 12 hours in advance.',
      privacyPolicy: 'We respect client privacy and process personal information strictly for booking services.',
    },
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
        alt: 'Modern fade haircut',
      },
      {
        url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
        alt: 'Beard trim service',
      },
    ],
    testimonials: [
      {
        name: 'James Adebayo',
        rating: 5,
        comment: 'Best barbershop in Lagos! The Modern Barber gave me the perfect fade.',
        date: new Date('2024-01-15'),
      },
    ],
    comparePassword: async function (candidatePassword) {
      return candidatePassword === this.password || candidatePassword === 'password123';
    },
  };

  const adminUser = {
    _id: 'mock_user_admin_id_456',
    name: 'Nile Administrator',
    email: 'admin@nile.ng',
    password: 'password123',
    role: 'admin',
    businessName: 'Nile Booking Platform',
    slug: 'admin',
    phone: '+234 800 000 0000',
    comparePassword: async function (candidatePassword) {
      return candidatePassword === this.password || candidatePassword === 'password123';
    },
  };

  mockUsers.set('barber@nile.ng', barberUser);
  mockUsers.set('admin@nile.ng', adminUser);

  mockSchedules.set(barberUser._id, {
    provider: barberUser._id,
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

  mockServices.push(
    {
      _id: 'mock_service_1',
      provider: barberUser._id,
      name: 'Skin Fade',
      description: 'Premium skin fade haircut with precision detailing.',
      category: 'haircut',
      price: 5000,
      duration: 0.75,
      capacity: 1,
      isActive: true,
    },
    {
      _id: 'mock_service_2',
      provider: barberUser._id,
      name: 'Beard Trim',
      description: 'Professional beard trimming and shaping.',
      category: 'beard',
      price: 3000,
      duration: 0.5,
      capacity: 1,
      isActive: true,
    }
  );
};

// Setter function to enable/disable mock mode
export const setMockMode = (enabled) => {
  MOCK_MODE = enabled;
  if (enabled) {
    initializeMockData();
    console.log('✅ Mock data initialized with barber@nile.ng and admin@nile.ng');
  }
};

// Getter function for mock mode status
export const getMockMode = () => MOCK_MODE;
