import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const axios = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: axios }));
const { refreshDomain, resolvePublicTenant } = await import('../services/domain/domainService.js');
const { default: User } = await import('../models/User.js');
const { default: CustomDomain } = await import('../models/CustomDomain.js');

let db;
const saved = {};
beforeAll(async () => {
  for (const key of ['VERCEL', 'VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'NILE_STOREFRONT_PROJECT_ID']) saved[key] = process.env[key];
  process.env.VERCEL = '1';
  process.env.VERCEL_TOKEN = 'test-only-token';
  process.env.VERCEL_PROJECT_ID = 'prj_backend';
  process.env.NILE_STOREFRONT_PROJECT_ID = 'prj_storefront';
  db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
}, 60000);
afterAll(async () => {
  await mongoose.disconnect();
  await db?.stop();
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
beforeEach(async () => {
  axios.mockReset();
  await Promise.all([User.deleteMany({}), CustomDomain.deleteMany({})]);
});

it('activates a verified pending domain and resolves its merchant for the storefront', async () => {
  const merchant = await User.create({ name: 'Studio', email: 'studio@example.com', password: 'test-password-123', role: 'provider', slug: 'studio' });
  const domain = await CustomDomain.create({ merchant: merchant._id, domain: 'studio.shop', source: 'connected', status: 'DNS_PENDING', active: false });
  axios.mockResolvedValue({ data: { name: 'studio.shop', verified: true } });
  expect(await resolvePublicTenant('studio.shop')).toBeNull();
  const active = await refreshDomain({ merchantId: merchant._id, domainId: domain._id });
  expect(active.status).toBe('ACTIVE');
  expect(active.active).toBe(true);
  expect(await resolvePublicTenant('studio.shop')).toMatchObject({ slug: 'studio', domain: 'studio.shop' });
  expect((await User.findById(merchant._id)).customDomain).toBe('studio.shop');
  expect(axios.mock.calls[0][0].url).toContain('/projects/prj_storefront/domains/');
});

it('does not activate unverified domains', async () => {
  const merchant = await User.create({ name: 'Studio', email: 'unverified@example.com', password: 'test-password-123', role: 'provider', slug: 'unverified' });
  const domain = await CustomDomain.create({ merchant: merchant._id, domain: 'unverified.shop', source: 'connected', status: 'DNS_PENDING', active: false });
  axios.mockResolvedValue({ data: { name: 'unverified.shop', verified: false } });
  expect((await refreshDomain({ merchantId: merchant._id, domainId: domain._id })).active).toBe(false);
  expect(await resolvePublicTenant('unverified.shop')).toBeNull();
});

it('surfaces hosting lookup errors during Check status without activating the domain', async () => {
  const merchant = await User.create({ name: 'Studio', email: 'denied@example.com', password: 'test-password-123', role: 'provider', slug: 'denied' });
  const domain = await CustomDomain.create({ merchant: merchant._id, domain: 'denied.shop', source: 'connected', status: 'DNS_PENDING', active: false });
  axios.mockRejectedValue({ response: { status: 403, data: { error: { message: 'Not authorized' } } } });
  await expect(refreshDomain({ merchantId: merchant._id, domainId: domain._id })).rejects.toMatchObject({ code: 'VERCEL_DOMAIN_ERROR' });
  expect((await CustomDomain.findById(domain._id)).active).toBe(false);
});
