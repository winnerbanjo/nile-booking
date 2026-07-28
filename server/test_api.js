import jwt from 'jsonwebtoken';

const JWT_SECRET = 'nile_super_secure_jwt_production_secret_2026_key';

// Mock user IDs (MongoDB ObjectIds)
const userA = '69a583add5a928ecc1149eff'; // WINNER OYEBANJO
const userB = '69a6236e0e436219416406bb'; // Akinsola

const tokenA = jwt.sign({ id: userA }, JWT_SECRET, { expiresIn: '1h' });
const tokenB = jwt.sign({ id: userB }, JWT_SECRET, { expiresIn: '1h' });

const API_URL = 'http://localhost:5050/api';

async function req(path, method, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.text();
  let json = {};
  try { json = JSON.parse(data); } catch (e) {}
  return { status: res.status, data: json, raw: data };
}

async function runTests() {
  console.log('--- Merchant A Creating Categories ---');
  let res = await req('/service-categories', 'POST', tokenA, { name: 'Classic Lashes' });
  console.log('Merchant A Create (Classic Lashes):', res.status, res.raw);
  const catAId = res.data?.data?._id;

  await req('/service-categories', 'POST', tokenA, { name: 'Volume Lashes' });
  await req('/service-categories', 'POST', tokenA, { name: 'Lash Refills' });

  console.log('--- Merchant B Creating Categories ---');
  let resB = await req('/service-categories', 'POST', tokenB, { name: 'Haircuts' });
  console.log('Merchant B Create (Haircuts):', resB.status, res.raw);
  const catBId = resB.data?.data?._id;

  await req('/service-categories', 'POST', tokenB, { name: 'Beard Services' });

  console.log('--- Merchant A CRUD Tests ---');
  res = await req('/service-categories', 'GET', tokenA);
  console.log('GET /service-categories:', res.status, res.raw);

  res = await req(`/service-categories/${catAId}`, 'GET', tokenA);
  console.log('GET /service-categories/:id:', res.status, res.raw);

  res = await req(`/service-categories/${catAId}`, 'PATCH', tokenA, { name: 'Classic Lashes Updated' });
  console.log('PATCH /service-categories/:id:', res.status, res.raw);

  res = await req(`/service-categories/reorder`, 'PATCH', tokenA, { categories: [{ id: catAId, sortOrder: 1 }] });
  console.log('PATCH /service-categories/reorder:', res.status, res.raw);

  res = await req(`/service-categories/${catAId}`, 'DELETE', tokenA);
  console.log('DELETE /service-categories/:id:', res.status, res.raw);

  console.log('--- Cross-Merchant Security Tests ---');
  res = await req(`/service-categories/${catBId}`, 'GET', tokenA);
  console.log('GET Merchant B category with Merchant A:', res.status, res.raw);

  res = await req(`/service-categories/${catBId}`, 'PATCH', tokenA, { name: 'Hacked' });
  console.log('PATCH Merchant B category with Merchant A:', res.status, res.raw);

  res = await req(`/service-categories/${catBId}`, 'DELETE', tokenA);
  console.log('DELETE Merchant B category with Merchant A:', res.status, res.raw);

  res = await req(`/service-categories/reorder`, 'PATCH', tokenA, { categories: [{ id: catBId, sortOrder: 1 }] });
  console.log('PATCH reorder Merchant B category with Merchant A:', res.status, res.raw);

}

runTests();
