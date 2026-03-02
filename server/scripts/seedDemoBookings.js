import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

export const seedDemoBookings = async (passedBarberId = null) => {
  try {
    // 1. Find the Barber
    const barber = await User.findOne({ email: 'barber@nile.ng' });
    if (!barber) throw new Error("Barber barber@nile.ng not found in DB");
    
    const barberId = barber._id;

    // 2. Wipe old data
    await Booking.deleteMany({ provider: barberId });
    console.log(`🗑️  Deleted old demo bookings for barber ${barberId}`);

    // 3. Ensure we have at least one Service to link to
    let service = await Service.findOne({ provider: barberId });
    if (!service) {
      console.log("🛠️  Creating initial service for seeder...");
      service = await Service.create({
        provider: barberId,
        name: 'Classic Cut',
        price: 15000,
        category: 'other',
        isActive: true
      });
    }

    // 4. Generate the "Today's Flow" (Hardcoded to avoid mapping errors)
    const now = new Date();
    const demoData = [
      { name: 'Adeola Johnson', email: 'adeola@example.com', phone: '+2348123456789', price: 15000, status: 'completed', paymentStatus: 'paid', paymentType: 'full' },
      { name: 'Chukwu Emeka', email: 'chukwu@example.com', phone: '+2348123456790', price: 12000, status: 'pending', paymentStatus: 'pending', paymentType: 'pay_later' },
      { name: 'Tunde Adeyemi', email: 'tunde@example.com', phone: '+2348123456791', price: 18000, status: 'confirmed', paymentStatus: 'paid', paymentType: 'full' },
      { name: 'Kemi Okafor', email: 'kemi@example.com', phone: '+2348123456792', price: 15000, status: 'confirmed', paymentStatus: 'paid', paymentType: 'full' },
      { name: 'David Okonkwo', email: 'david@example.com', phone: '+2348123456793', price: 20000, status: 'pending', paymentStatus: 'partial', paymentType: 'deposit' }
    ];

    const finalBookings = demoData.map((b, i) => {
      const servicePrice = b.price;
      const depositAmount = b.paymentType === 'deposit' ? servicePrice * 0.3 : 0;
      const totalAmount = b.paymentType === 'pay_later' ? 0 : (b.paymentType === 'deposit' ? depositAmount : servicePrice);
      
      return {
        provider: barberId,
        service: service._id,
        customer: { 
          name: b.name, 
          email: b.email, 
          phone: b.phone 
        },
        pricing: { 
          servicePrice,
          depositAmount,
          totalAmount,
          currency: 'NGN' 
        },
        paymentType: b.paymentType,
        paymentStatus: b.paymentStatus,
        status: b.status,
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000), // Spread across days
        timeSlot: { startTime: `${9 + i}:00`, endTime: `${9 + i + 1}:00` },
        bookingNumber: `NB-DEMO-${String(i + 1).padStart(3, '0')}`
      };
    });

    await Booking.insertMany(finalBookings);
    console.log(`✅ SEED SUCCESS: Generated ${finalBookings.length} bookings for Nile Booking.`);

  } catch (error) {
    console.error('❌ Seeding Logic Failed:', error.message);
  }
};