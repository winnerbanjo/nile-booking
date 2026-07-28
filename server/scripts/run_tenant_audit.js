import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';

const MONGODB_URI = process.env.MONGODB_URI;
const API_BASE = 'https://api.nilebooking.co/api';

async function fullE2EAudit() {
  console.log('⚡ STARTING FULL LIVE E2E TENANT ISOLATION & DATA COUNT VERIFICATION');
  await mongoose.connect(MONGODB_URI);

  const ts = Date.now();
  const emailA = `merchant_a_${ts}@nilebooking.co`;
  const emailB = `merchant_b_${ts}@nilebooking.co`;
  const bizA = `Audit Biz ${ts}`;
  const bizB = `Audit Studio ${ts}`;
  const password = 'Password2026!';

  // Step 1: Register Merchant A (minimum required fields only - bank details optional)
  console.log('\n--- 1. Registering Merchant A ---');
  const regARes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: bizA,
      email: emailA,
      password: password,
      businessName: bizA,
      phone: '+2348123456781',
    }),
  });
  const regAData = await regARes.json();
  console.log('Merchant A Register:', regARes.status, regAData.message);

  // Step 2: Register Merchant B
  console.log('\n--- 2. Registering Merchant B ---');
  const regBRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: bizB,
      email: emailB,
      password: password,
      businessName: bizB,
      phone: '+2348123456782',
    }),
  });
  const regBData = await regBRes.json();
  console.log('Merchant B Register:', regBRes.status, regBData.message);

  // Retrieve users directly from Atlas
  const userA = await User.findOne({ email: emailA }).select('+otpCode');
  const userB = await User.findOne({ email: emailB }).select('+otpCode');

  if (!userA || !userB) {
    console.error('❌ Users not created in DB. Register failed. Check above status messages.');
    await mongoose.disconnect();
    return;
  }

  console.log('OTP A:', userA.otpCode, '| OTP B:', userB.otpCode);

  // Step 3: Verify OTPs
  console.log('\n--- 3. Verifying OTPs ---');
  const verifyARes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, otpCode: userA.otpCode }),
  });
  const verifyAData = await verifyARes.json();
  const tokenA = verifyAData.token;
  console.log('Merchant A Verify:', verifyARes.status, tokenA ? '✅ Token OK' : '❌ No token — ' + verifyAData.message);

  const verifyBRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, otpCode: userB.otpCode }),
  });
  const verifyBData = await verifyBRes.json();
  const tokenB = verifyBData.token;
  console.log('Merchant B Verify:', verifyBRes.status, tokenB ? '✅ Token OK' : '❌ No token — ' + verifyBData.message);

  if (!tokenA || !tokenB) {
    await mongoose.disconnect();
    return;
  }

  // Step 4: Verify clean slate counts in Atlas
  const refresh_a = await User.findOne({ email: emailA });
  const refresh_b = await User.findOne({ email: emailB });

  const countA = {
    services: await Service.countDocuments({ provider: refresh_a._id }),
    bookings: await Booking.countDocuments({ provider: refresh_a._id }),
    transactions: await Transaction.countDocuments({ provider: refresh_a._id }),
  };
  const countB = {
    services: await Service.countDocuments({ provider: refresh_b._id }),
    bookings: await Booking.countDocuments({ provider: refresh_b._id }),
    transactions: await Transaction.countDocuments({ provider: refresh_b._id }),
  };

  console.log('\n--- 4. Initial DB Counts (must be 0,0,0) ---');
  console.log('Merchant A:', JSON.stringify(countA));
  console.log('Merchant B:', JSON.stringify(countB));

  const cleanSlate =
    countA.services === 0 && countA.bookings === 0 && countA.transactions === 0 &&
    countB.services === 0 && countB.bookings === 0 && countB.transactions === 0;
  console.log('Clean Slate Check:', cleanSlate ? '✅ PASS' : '❌ FAIL — demo data present!');

  // Step 5: Add 1 service for Merchant A
  console.log('\n--- 5. Adding Service for Merchant A ---');
  const createServiceRes = await fetch(`${API_BASE}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: 'Signature Hair Styling',
      description: 'Professional luxury hair styling and wash',
      price: 15000,
      duration: 1,
      category: 'Hair Care',
    }),
  });
  const createServiceData = await createServiceRes.json();
  console.log('Service Created:', createServiceRes.status, createServiceData.name || createServiceData.message);

  // Step 6: Verify public storefront for Merchant A shows 1 service
  console.log('\n--- 6. Public Storefront Check ---');
  const slug = refresh_a.slug || (await User.findOne({ email: emailA })).slug;
  const publicRes = await fetch(`${API_BASE}/services/provider/${slug}`);
  const publicData = await publicRes.json();
  console.log('Public Status:', publicRes.status);
  console.log('Public Services Count:', publicData.services?.length, '| Service Name:', publicData.services?.[0]?.name);
  console.log('Storefront Check:', publicData.services?.length === 1 ? '✅ PASS' : '❌ FAIL');

  // Step 7: Cross-tenant isolation - Merchant B fetches Merchant A's services (must see 0)
  console.log('\n--- 7. Cross-Tenant Isolation: Merchant B cannot see Merchant A services ---');
  const crossTenantRes = await fetch(`${API_BASE}/services`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const crossTenantData = await crossTenantRes.json();
  console.log('Merchant B GET /services count:', crossTenantData.length, crossTenantData.length === 0 ? '✅ PASS' : '❌ FAIL');

  // Step 8: No-auth 401 checks
  console.log('\n--- 8. Unauthorized Access ---');
  const noAuthRes = await fetch(`${API_BASE}/auth/me`);
  console.log('No Token /auth/me:', noAuthRes.status, noAuthRes.status === 401 ? '✅ PASS' : '❌ FAIL');

  const badTokenRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: 'Bearer invalid_token_here' },
  });
  console.log('Invalid Token /auth/me:', badTokenRes.status, badTokenRes.status === 401 ? '✅ PASS' : '❌ FAIL');

  // Step 9: Invalid slug returns 404
  console.log('\n--- 9. Invalid Slug 404 Check ---');
  const invalidSlugRes = await fetch(`${API_BASE}/services/provider/nonexistent-invalid-slug-99999`);
  console.log('Invalid Slug Status:', invalidSlugRes.status, invalidSlugRes.status === 404 ? '✅ PASS' : '❌ FAIL');

  // Step 10: Human UX copy checks
  console.log('\n--- 10. Human UX Copy Verification ---');
  const unknownEmailRes = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unknownemail999@nilebooking.co' }),
  });
  const unknownEmailData = await unknownEmailRes.json();
  console.log('Forgot Password Unknown Email:', unknownEmailRes.status);
  console.log('Message:', unknownEmailData.message);

  const wrongPassRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password: 'WrongPassword!!!' }),
  });
  const wrongPassData = await wrongPassRes.json();
  console.log('Wrong Password:', wrongPassRes.status);
  console.log('Message:', wrongPassData.message);

  // Clean up audit users
  await Service.deleteMany({ provider: { $in: [refresh_a._id, refresh_b._id] } });
  await User.deleteMany({ _id: { $in: [refresh_a._id, refresh_b._id] } });
  console.log('\n🧹 Audit users cleaned up.');

  await mongoose.disconnect();
  console.log('\n✅ ALL E2E AUDIT TESTS COMPLETE!');
}

fullE2EAudit().catch((e) => {
  console.error('❌ AUDIT FAILED:', e.message);
  process.exit(1);
});
