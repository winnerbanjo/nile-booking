// Mock mode state management
// Shared between server.js and controllers

let MOCK_MODE = false;
const mockUsers = new Map();
const mockSchedules = new Map();
const mockServices = [];
const mockStaff = [];

export { MOCK_MODE, mockUsers, mockSchedules, mockServices, mockStaff };

export const initializeMockData = () => {
  // Prevent duplicate initialization
  if (mockUsers.size > 0) return;

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
      policies: { terms: 'Confirm appointments 24h prior. No refunds on deposits.' },
      gallery: gallery,
      testimonials: [
        { name: 'Happy Client', rating: 5, comment: `Amazing experience with ${businessName}! Highly recommended.`, date: new Date() },
        { name: 'Sarah O.', rating: 5, comment: 'Absolutely stunning work, professional and on time.', date: new Date() }
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

  // 1. The Modern Chef
  createMockProvider(
    'mock_chef', 'chef@nile.ng', 'The Modern Chef', 'the-modern-chef',
    'Private culinary experiences, exclusive catering, and bespoke meal prep for the modern professional. Bringing fine dining to the comfort of your home.',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', alt: 'Gourmet steak' },
      { url: 'https://images.unsplash.com/photo-1560614382-33f2824e4605?w=800&h=600&fit=crop', alt: 'Private Dining Setup' },
      { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop', alt: 'Plated Dessert' },
      { url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=600&fit=crop', alt: 'Chef Plating' },
    ],
    [
      { name: 'Private Dinner for Two', description: 'A 5-course bespoke culinary experience at your home.', category: 'Private Dining', price: 150000, duration: 4 },
      { name: 'Event Catering Consultation', description: 'Discuss menu options for your upcoming event.', category: 'Consultation', price: 20000, duration: 1 },
      { name: 'Family Style Sunday Brunch', description: 'A lavish brunch spread for up to 6 people.', category: 'Catering', price: 250000, duration: 3 },
      { name: 'Premium Meal Prep (Weekly)', description: '5 days of customized, healthy gourmet meals.', category: 'Meal Prep', price: 100000, duration: 2 },
      { name: 'Sushi Making Masterclass', description: 'Interactive private class on making authentic sushi.', category: 'Masterclass', price: 80000, duration: 2.5 },
      { name: 'Corporate Lunch Catering', description: 'Gourmet lunch boxes for your executive team (up to 15).', category: 'Corporate', price: 300000, duration: 2 },
      { name: 'Wine Tasting Pairing Menu', description: '7-course tasting menu paired with sommelier-selected wines.', category: 'Private Dining', price: 250000, duration: 4 },
      { name: 'Outdoor BBQ Extravaganza', description: 'Premium meats and sides for your garden party.', category: 'Catering', price: 400000, duration: 5 },
      { name: 'Canapés & Cocktails', description: 'Elegant bite-sized appetizers for intimate gatherings.', category: 'Catering', price: 180000, duration: 3 },
      { name: 'Pastry & Dessert Workshop', description: 'Learn the art of French patisserie at home.', category: 'Masterclass', price: 60000, duration: 2 },
    ]
  );

  // 2. Glamour MUA
  createMockProvider(
    'mock_mua', 'mua@nile.ng', 'Glamour MUA', 'glamour-mua',
    'Award-winning Bridal & Editorial Makeup Artist. Accentuating natural beauty for your most important moments with luxury cosmetics and flawless techniques.',
    'https://images.unsplash.com/photo-1512496015851-a1fbcf69d531?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13fee7a3af?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop', alt: 'Bridal look' },
      { url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=600&fit=crop', alt: 'Soft Glam' },
      { url: 'https://images.unsplash.com/photo-1516975080661-460d3dce70bb?w=800&h=600&fit=crop', alt: 'Editorial Makeup' },
      { url: 'https://images.unsplash.com/photo-1526045612212-70cb359b2dea?w=800&h=600&fit=crop', alt: 'Makeup Kit' },
    ],
    [
      { name: 'Signature Bridal Makeup', description: 'Full bridal glam including premium lashes, airbrush finish, and touch-up kit.', category: 'Bridal', price: 150000, duration: 3 },
      { name: 'Bridal Trial Session', description: '1-on-1 consultation to perfect your look before the big day.', category: 'Bridal', price: 50000, duration: 2 },
      { name: 'Soft Glam Session', description: 'Perfect for bridesmaids, photoshoots, and evening events.', category: 'Glam', price: 40000, duration: 1.5 },
      { name: 'Full Glam & Cut Crease', description: 'Dramatic, bold look with heavy contour and luxury lashes.', category: 'Glam', price: 55000, duration: 2 },
      { name: 'Editorial / High Fashion', description: 'Creative, avant-garde makeup for magazines and fashion shoots.', category: 'Editorial', price: 80000, duration: 2.5 },
      { name: 'Male Grooming', description: 'Subtle enhancement, skin prep, and anti-shine for grooms or talent.', category: 'Grooming', price: 25000, duration: 1 },
      { name: 'Special FX / Halloween', description: 'Theatrical makeup using prosthetics and special effects.', category: 'Creative', price: 100000, duration: 4 },
      { name: '1-on-1 Makeup Lesson', description: 'Learn to do your own everyday makeup like a pro.', category: 'Education', price: 75000, duration: 3 },
      { name: 'Gele Tying Only', description: 'Expert Gele tying for traditional events.', category: 'Traditional', price: 15000, duration: 0.5 },
      { name: 'Traditional Engagement Look', description: 'Full traditional glam including Gele tying and body glow.', category: 'Bridal', price: 120000, duration: 2.5 },
    ]
  );

  // 3. Elite Hair Studio
  createMockProvider(
    'mock_hair', 'hair@nile.ng', 'Elite Hair Studio', 'elite-hair-studio',
    'Luxury salon specializing in silk presses, coloring, protective styling, and healthy hair maintenance. Your hair is your crown, let us polish it.',
    'https://images.unsplash.com/photo-1521590832167-7bfcbaa6362d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?w=800&h=600&fit=crop', alt: 'Silk Press' },
      { url: 'https://images.unsplash.com/photo-1582095133179-bfd08e2f1084?w=800&h=600&fit=crop', alt: 'Hair Coloring' },
      { url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop', alt: 'Wig Install' },
      { url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop', alt: 'Braids' },
    ],
    [
      { name: 'Signature Silk Press', description: 'Includes deep conditioning treatment, trim, and sleek finish.', category: 'Styling', price: 45000, duration: 2 },
      { name: 'Custom Wig Installation', description: 'Flawless glueless or glued installation with plucking and styling.', category: 'Installation', price: 35000, duration: 1.5 },
      { name: 'Full Head Color & Highlights', description: 'Transformative color service. Consultation required.', category: 'Color', price: 85000, duration: 4 },
      { name: 'Knotless Box Braids (Mid-Back)', description: 'Neat, painless knotless braids. Hair extensions included.', category: 'Braids', price: 60000, duration: 5 },
      { name: 'Tape-In Extensions', description: 'Seamless tape-in installation for length and volume.', category: 'Extensions', price: 120000, duration: 3 },
      { name: 'Relaxer & Treatment', description: 'Virgin or touch-up relaxer with protein balancing treatment.', category: 'Chemical', price: 30000, duration: 2 },
      { name: 'Bridal Hair Styling', description: 'Elegant updos or Hollywood waves for your wedding day.', category: 'Bridal', price: 75000, duration: 2 },
      { name: 'Wash, Blowdry & Style', description: 'Routine maintenance wash and basic styling.', category: 'Maintenance', price: 15000, duration: 1 },
      { name: 'Microlinks Maintenance', description: 'Tightening and styling for existing microlink installs.', category: 'Extensions', price: 40000, duration: 2.5 },
      { name: 'Scalp Detox & Steaming', description: 'Deep cleansing scalp treatment to promote hair growth.', category: 'Treatment', price: 20000, duration: 1 },
    ]
  );

  // 4. Zenith Photography
  createMockProvider(
    'mock_photo', 'photo@nile.ng', 'Zenith Photography', 'zenith-photography',
    'Capturing life’s milestones with precision and art. Professional portrait, lifestyle, and editorial photography studio.',
    'https://images.unsplash.com/photo-1554046920-90dcac415392?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1517436073-3b1b1519fca9?w=800&h=600&fit=crop', alt: 'Portrait Session' },
      { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop', alt: 'Wedding Photography' },
      { url: 'https://images.unsplash.com/photo-1604928141064-207cea6f5722?w=800&h=600&fit=crop', alt: 'Product Shoot' },
      { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop', alt: 'Event Coverage' },
    ],
    [
      { name: 'Studio Portrait Session', description: '1-hour studio session, 2 looks, 10 retouched images.', category: 'Portraits', price: 60000, duration: 1 },
      { name: 'Professional Headshots', description: 'Clean, crisp headshots for LinkedIn and corporate profiles. 3 retouched images.', category: 'Corporate', price: 40000, duration: 0.5 },
      { name: 'Event Coverage (Hourly)', description: 'Professional roaming coverage for your intimate events and parties.', category: 'Events', price: 85000, duration: 1 },
      { name: 'Maternity Shoot', description: 'Celebrate motherhood. 2-hour session, multiple setups, 15 retouched images.', category: 'Lifestyle', price: 120000, duration: 2 },
      { name: 'Engagement / Pre-Wedding', description: 'Outdoor storytelling session. Includes drone footage and 20 retouched images.', category: 'Wedding', price: 200000, duration: 3 },
      { name: 'Full Wedding Package', description: '10 hours of coverage, 2 photographers, photobook, and digital gallery.', category: 'Wedding', price: 850000, duration: 10 },
      { name: 'E-Commerce Product Shoot', description: 'Clean white-background shots for up to 10 products.', category: 'Commercial', price: 150000, duration: 4 },
      { name: 'Fashion Editorial', description: 'Creative outdoor or studio session for brands and models.', category: 'Commercial', price: 180000, duration: 3 },
      { name: 'Family Portrait Session', description: 'Fun, candid, and posed shots for the whole family.', category: 'Portraits', price: 75000, duration: 1.5 },
      { name: 'Birthday Shoot Experience', description: 'Includes props, creative lighting, and a birthday reel for Instagram.', category: 'Lifestyle', price: 90000, duration: 2 },
    ]
  );

  // Legacy barber to keep existing tests working
  createMockProvider(
    'mock_user_barber_id_123', 'barber@nile.ng', 'The Modern Barber', 'the-modern-barber',
    'Premium barbershop specializing in modern cuts.',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop',
    [
      { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop', alt: 'Modern fade haircut' },
    ],
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
