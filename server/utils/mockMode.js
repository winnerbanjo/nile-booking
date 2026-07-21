// Mock mode state management
// Shared between server.js and controllers

let MOCK_MODE = false;
const mockUsers = new Map();
const mockSchedules = new Map();
const mockServices = [];
const mockStaff = [];

export { MOCK_MODE, mockUsers, mockSchedules, mockServices, mockStaff };

const createMockProvider = (id, email, businessName, slug, bio, profileImage, headerImage, gallery, services) => {
  const provider = {
    _id: id,
    name: businessName,
    email: email,
    password: 'password123',
    role: 'provider',
    businessName: businessName,
    slug: slug,
    phone: '+234 800 000 0000',
    bio: bio,
    location: 'Lagos, Nigeria',
    profileImage: profileImage,
    logo: profileImage,
    headerImage: headerImage,
    address: { street: 'Victoria Island', city: 'Lagos', country: 'Nigeria', zipCode: '101001' },
    socialHandles: { instagram: `@${slug}` },
    paymentMethods: { cash: true, transfer: true, card: false },
    policies: { terms: 'Confirm appointments 24h prior.' },
    gallery: gallery,
    testimonials: [
      { name: 'Happy Client', rating: 5, comment: `Amazing service from ${businessName}!`, date: new Date() }
    ],
    comparePassword: async function(pass) { return pass === this.password || pass === 'password123'; }
  };

  mockUsers.set(email, provider);

  // Default Schedule
  mockSchedules.set(id, {
    provider: id,
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

  services.forEach((s, idx) => {
    mockServices.push({
      _id: `service_${id}_${idx}`,
      provider: id,
      name: s.name,
      description: s.description,
      category: s.category,
      price: s.price,
      duration: s.duration,
      capacity: 1,
      isActive: true,
    });
  });
};

export const initializeMockData = () => {
  // Prevent duplicate initialization
  if (mockUsers.size > 0) return;

  // 1. The Modern Chef
  createMockProvider(
    'mock_chef', 'chef@nile.ng', 'The Modern Chef', 'the-modern-chef',
    'Private culinary experiences, exclusive catering, and bespoke meal prep for the modern professional.',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', alt: 'Gourmet steak' },
      { url: 'https://images.unsplash.com/photo-1560614382-33f2824e4605?w=800&h=600&fit=crop', alt: 'Private Dining' }
    ],
    [
      { name: 'Private Dinner for Two', description: 'A 5-course bespoke culinary experience at your home.', category: 'Private Dining', price: 150000, duration: 4 },
      { name: 'Event Catering Consultation', description: 'Discuss menu options for your upcoming event.', category: 'Consultation', price: 20000, duration: 1 }
    ]
  );

  // 2. Glamour MUA
  createMockProvider(
    'mock_mua', 'mua@nile.ng', 'Glamour MUA', 'glamour-mua',
    'Bridal & Editorial Makeup Artist. Accentuating natural beauty for your most important moments.',
    'https://images.unsplash.com/photo-1512496015851-a1fbcf69d531?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13fee7a3af?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop', alt: 'Bridal look' }
    ],
    [
      { name: 'Bridal Makeup', description: 'Full bridal glam including premium lashes and touch-up kit.', category: 'Bridal', price: 120000, duration: 2.5 },
      { name: 'Soft Glam Session', description: 'Perfect for photoshoots and evening events.', category: 'Glam', price: 35000, duration: 1.5 }
    ]
  );

  // 3. Elite Hair Studio
  createMockProvider(
    'mock_hair', 'hair@nile.ng', 'Elite Hair Studio', 'elite-hair-studio',
    'Luxury salon specializing in silk presses, coloring, and protective styling.',
    'https://images.unsplash.com/photo-1521590832167-7bfcbaa6362d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=800&h=600&fit=crop', alt: 'Silk Press' }
    ],
    [
      { name: 'Signature Silk Press', description: 'Includes deep conditioning treatment and trim.', category: 'Styling', price: 45000, duration: 2 },
      { name: 'Custom Wig Installation', description: 'Flawless glueless or glued installation with styling.', category: 'Installation', price: 30000, duration: 1.5 }
    ]
  );

  // 4. Zenith Photography
  createMockProvider(
    'mock_photo', 'photo@nile.ng', 'Zenith Photography', 'zenith-photography',
    'Capturing life’s milestones. Professional portrait and lifestyle photography.',
    'https://images.unsplash.com/photo-1554046920-90dcac415392?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1517436073-3b1b1519fca9?w=800&h=600&fit=crop', alt: 'Portrait Session' }
    ],
    [
      { name: 'Studio Portrait Session', description: '1-hour studio session, 2 looks, 10 retouched images.', category: 'Portraits', price: 60000, duration: 1 },
      { name: 'Event Coverage (Hourly)', description: 'Professional coverage for your intimate events.', category: 'Events', price: 85000, duration: 1 }
    ]
  );

  // Legacy barber to keep existing tests working
  createMockProvider(
    'mock_user_barber_id_123', 'barber@nile.ng', 'The Modern Barber', 'the-modern-barber',
    'Premium barbershop specializing in modern cuts.',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop',
    [],
    [
      { name: 'Skin Fade', description: 'Premium fade', category: 'haircut', price: 5000, duration: 0.75 },
      { name: 'Beard Trim', description: 'Beard trim', category: 'beard', price: 3000, duration: 0.5 }
    ]
  );

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
  mockUsers.set('admin@nile.ng', adminUser);
};

export const setMockMode = (enabled) => {
  MOCK_MODE = enabled;
  if (enabled) {
    initializeMockData();
    console.log('✅ Mock data initialized with sample stores');
  }
};

export const getMockMode = () => MOCK_MODE;
