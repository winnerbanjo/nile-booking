import mongoose from 'mongoose';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const API_BASE = process.env.API_BASE || 'https://api.nilebooking.co/api';

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required.');
  process.exit(1);
}

if (!process.env.CONFIRM_PROD_WRITE) {
  console.error('ERROR: You must set CONFIRM_PROD_WRITE=true to execute this script in production.');
  process.exit(1);
}

console.log('--- STARTING PROD E2E TEST ---');

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const timestamp = Date.now();
  const merchantEmailA = `qa.full.${timestamp}@example.com`;
  const merchantEmailB = `qa.skip.${timestamp}@example.com`;
  const merchantEmailC = `qa.auth.${timestamp}@example.com`;
  
  const slugA = `qa-full-${timestamp}`;
  const slugB = `qa-skip-${timestamp}`;
  const slugC = `qa-auth-${timestamp}`;

  const createdRecords = [];

  try {
    // ==========================================
    // TEST 1: NEW MERCHANT - FULL FLOW
    // ==========================================
    console.log(`\n>> TEST 1: New Merchant (Full Flow) - ${merchantEmailA}`);
    let res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Full Flow',
        email: merchantEmailA,
        password: 'Password123!',
        country: 'NG',
        businessName: 'QA Full Business',
        slug: slugA
      })
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
    
    let user = await User.findOne({ email: merchantEmailA });
    createdRecords.push({ type: 'User', id: user._id, email: user.email });
    
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailA, otpCode: user.otpCode })
    });
    if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
    let verifyData = await res.json();
    let tokenA = verifyData.token;
    
    res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Haircut', description: 'Clean fade', category: 'other', price: 5000, duration: 1 })
    });
    if (!res.ok) throw new Error(`Service create failed: ${res.status}`);

    res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ firstServiceAdded: true, onboardingCompleted: true })
    });
    if (!res.ok) {
        let msg = await res.text();
        throw new Error(`Onboarding PATCH failed: ${res.status} - ${msg}`);
    }
    console.log('✅ Test 1 Passed');

    // ==========================================
    // TEST 2: NEW MERCHANT - SKIP FLOW
    // ==========================================
    console.log(`\n>> TEST 2: New Merchant (Skip Flow) - ${merchantEmailB}`);
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Skip Flow',
        email: merchantEmailB,
        password: 'Password123!',
        country: 'NG',
        businessName: 'QA Skip Business',
        slug: slugB
      })
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
    
    user = await User.findOne({ email: merchantEmailB });
    createdRecords.push({ type: 'User', id: user._id, email: user.email });
    
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailB, otpCode: user.otpCode })
    });
    if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
    let verifyDataB = await res.json();
    let tokenB = verifyDataB.token;
    
    res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ firstServiceSkipped: true, onboardingCompleted: true })
    });
    if (!res.ok) throw new Error(`Onboarding PATCH failed: ${res.status}`);
    console.log('✅ Test 2 Passed');

    // ==========================================
    // TEST 3: AUTHENTICATION & FORGOT PASSWORD
    // ==========================================
    console.log(`\n>> TEST 3: Auth & Forgot Password - ${merchantEmailC}`);
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Auth Flow',
        email: merchantEmailC,
        password: 'Password123!',
        country: 'NG',
        businessName: 'QA Auth Business',
        slug: slugC
      })
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
    
    user = await User.findOne({ email: merchantEmailC });
    createdRecords.push({ type: 'User', id: user._id, email: user.email });
    
    res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailC, otpCode: user.otpCode })
    });
    
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailC, password: 'Password123!' })
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);

    res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailC })
    });
    if (!res.ok) throw new Error(`Forgot password failed: ${res.status}`);
    
    user = await User.findOne({ email: merchantEmailC });
    console.log('OTP received for reset (hidden for security)');

    res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: merchantEmailC, otpCode: user.otpCode, newPassword: 'NewPassword123!' })
    });
    if (!res.ok) throw new Error(`Reset password failed: ${res.status}`);
    console.log('✅ Test 3 Passed');

    console.log('\n--- QA RECORDS CREATED ---');
    console.log(JSON.stringify(createdRecords, null, 2));
    
  } catch (error) {
    console.error('\n❌ QA RUN FAILED:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
