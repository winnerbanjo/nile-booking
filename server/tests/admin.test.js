import request from 'supertest';
import app from '../app.js'; 
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { setMockMode, mockUsers } from '../utils/mockMode.js';
import adminRoutes from '../routes/adminRoutes.js';
import { resetRateLimitsForTests } from '../middleware/rateLimit.js';

const JWT_SECRET = process.env.JWT_SECRET;

describe('Master Admin Security and Stability Tests', () => {
  let adminToken;
  let providerToken;
  let customerToken;
  const invalidToken = 'Bearer invalid-token-string';

  beforeAll(() => {
    setMockMode(true);

    // Ensure a customer mock user exists
    mockUsers.set('customer@nile.ng', {
      _id: 'mock_user_customer_123',
      name: 'John Customer',
      email: 'customer@nile.ng',
      role: 'customer',
    });

    // Generate valid tokens
    adminToken = 'Bearer ' + jwt.sign({ id: 'mock_user_admin_id_456' }, JWT_SECRET);
    providerToken = 'Bearer ' + jwt.sign({ id: 'mock_chef' }, JWT_SECRET);
    customerToken = 'Bearer ' + jwt.sign({ id: 'mock_user_customer_123' }, JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ===========================================================================
  // PART 1: Authentication boundary tests for all endpoints
  // ===========================================================================
  const endpoints = [
    { path: '/api/admin/stats', method: 'get', adminExpected: 200 },
    { path: '/api/admin/providers', method: 'get', adminExpected: 200 },
    { path: '/api/admin/customers', method: 'get', adminExpected: 200 },
    { path: '/api/admin/bookings', method: 'get', adminExpected: 200 },
    { path: '/api/admin/verifications', method: 'get', adminExpected: 200 },
    { path: '/api/admin/transactions', method: 'get', adminExpected: 200 },
    { path: '/api/admin/payouts', method: 'get', adminExpected: 200 },
    { path: '/api/admin/refunds', method: 'get', adminExpected: 200 },
    { path: '/api/admin/settings', method: 'get', adminExpected: 200 },
    { path: '/api/admin/risk', method: 'get', adminExpected: 200 },
    // Write endpoints
    { path: '/api/admin/providers/507f1f77bcf86cd799439011/status', method: 'put', adminExpected: 404 },
    { path: '/api/admin/verifications/507f1f77bcf86cd799439011/verify', method: 'post', adminExpected: 404 },
  ];

  for (const ep of endpoints) {
    describe(`${ep.method.toUpperCase()} ${ep.path}`, () => {
      it('should return 401 with no token', async () => {
        const res = await request(app)[ep.method](ep.path);
        expect(res.statusCode).toBe(401);
      });

      it('should return 401 with invalid token', async () => {
        const res = await request(app)[ep.method](ep.path).set('Authorization', invalidToken);
        expect(res.statusCode).toBe(401);
      });

      it('should return 403 for Provider role', async () => {
        const res = await request(app)[ep.method](ep.path).set('Authorization', providerToken);
        expect(res.statusCode).toBe(403);
      });

      it('should return 403 for Customer role', async () => {
        const res = await request(app)[ep.method](ep.path).set('Authorization', customerToken);
        expect(res.statusCode).toBe(403);
      });

      it(`should return ${ep.adminExpected} for Admin role`, async () => {
        const res = await request(app)[ep.method](ep.path).set('Authorization', adminToken);
        expect(res.statusCode).toBe(ep.adminExpected);
      });
    });
  }

  // ===========================================================================
  // PART 2: Response contract assertions for list endpoints
  // ===========================================================================
  describe('Response contract: GET /api/admin/customers', () => {
    it('should return { data: [], pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/customers').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });
  });

  describe('Response contract: GET /api/admin/bookings', () => {
    it('should return { data: [], pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/bookings').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Response contract: GET /api/admin/transactions', () => {
    it('should return { data: [], pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/transactions').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Response contract: GET /api/admin/payouts', () => {
    it('should return { data: [], pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/payouts').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Response contract: GET /api/admin/refunds', () => {
    it('should return { data: [], pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/refunds').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('Response contract: GET /api/admin/settings', () => {
    it('should return known setting keys', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('subscriptionFee');
      expect(res.body).toHaveProperty('payoutDelayDays');
      expect(res.body).toHaveProperty('environment');
    });
  });

  describe('Response contract: GET /api/admin/risk', () => {
    it('should return { data: [], summary: {...}, pagination: {...} } shape', async () => {
      const res = await request(app).get('/api/admin/risk').set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('openDisputes');
    });
  });

  // ===========================================================================
  // PART 3: Error log traceability
  // ===========================================================================
  describe('Error reference traceability: POST /api/system/frontend-errors', () => {
    let testRefId;

    it('should accept a frontend error log and return the referenceId', async () => {
      testRefId = 'TEST-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const res = await request(app).post('/api/system/frontend-errors').send({
        referenceId: testRefId,
        message: 'Test error from admin test suite',
        route: '/admin/customers',
        environment: 'test',
        deploymentCommit: 'test-commit',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.referenceId).toBe(testRefId);
    });

    it('should retrieve the error log by referenceId (admin only)', async () => {
      const res = await request(app)
        .get(`/api/system/frontend-errors/${testRefId}`)
        .set('Authorization', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceId).toBe(testRefId);
      expect(res.body.data.message).toBe('Test error from admin test suite');
    });

    it('should block non-admin from retrieving error logs', async () => {
      const res = await request(app)
        .get(`/api/system/frontend-errors/${testRefId}`)
        .set('Authorization', providerToken);
      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for unknown referenceId', async () => {
      const res = await request(app)
        .get('/api/system/frontend-errors/NOTEXIST')
        .set('Authorization', adminToken);
      expect(res.statusCode).toBe(404);
    });
  });

  // ===========================================================================
  // PART 4: Admin Login Endpoint Tests
  // ===========================================================================
  describe('Admin Login: POST /api/auth/admin-login', () => {
    it('should return 400 when master key is missing', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Master key is required');
    });

    it('should return 401 when master key is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({ password: 'wrong-master-key' });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid master key');
    });

    it('should return 200 and a token when master key is correct', async () => {
      resetRateLimitsForTests();
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({ password: process.env.ADMIN_MASTER_KEY });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('admin');
      expect(res.body.email).toBe('admin@nilebooking.co');
    });
  });

  describe('Admin login backoff', () => {
    it('locks repeated failures for an IP with a Retry-After header', async () => {
      resetRateLimitsForTests();
      const ip = '203.0.113.77';

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const res = await request(app)
          .post('/api/auth/admin-login')
          .set('X-Forwarded-For', ip)
          .send({ password: 'wrong-master-key' });
        expect(res.statusCode).toBe(401);
      }

      const blocked = await request(app)
        .post('/api/auth/admin-login')
        .set('X-Forwarded-For', ip)
        .send({ password: 'wrong-master-key' });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.body.code).toBe('ADMIN_LOGIN_BACKOFF');
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // PART 5: Every registered /api/admin route is covered programmatically
  // ===========================================================================
  describe('All registered admin routes', () => {
    const adminRouterPaths = [];
    for (const layer of adminRoutes.stack) {
      if (!layer.route) continue;
      const routePath = layer.route.path.replace(/:([A-Za-z]+)/g, '507f1f77bcf86cd799439011');
      for (const method of Object.keys(layer.route.methods)) {
        if (layer.route.methods[method]) {
          adminRouterPaths.push({ method, path: `/api/admin${routePath}` });
        }
      }
    }

    it('enumerates at least one route and covers every registered route', () => {
      expect(adminRouterPaths.length).toBeGreaterThan(0);
      expect(new Set(adminRouterPaths.map((route) => `${route.method}:${route.path}`)).size)
        .toBe(adminRouterPaths.length);
    });

    for (const route of adminRouterPaths) {
      it(`${route.method.toUpperCase()} ${route.path} rejects missing and non-admin tokens`, async () => {
        resetRateLimitsForTests();
        const noToken = await request(app)[route.method](route.path);
        expect(noToken.statusCode).toBe(401);

        const provider = await request(app)[route.method](route.path)
          .set('Authorization', providerToken);
        expect(provider.statusCode).toBe(403);

        const customer = await request(app)[route.method](route.path)
          .set('Authorization', customerToken);
        expect(customer.statusCode).toBe(403);
      });
    }
  });
});
