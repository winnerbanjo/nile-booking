import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { setMockMode, mockUsers } from '../utils/mockMode.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Custom Domain Routing and Registration Tests', () => {
  let providerToken;

  beforeAll(() => {
    setMockMode(true);

    mockUsers.set('mock_provider', {
      _id: 'mock_provider',
      name: 'John Provider',
      email: 'provider@nile.ng',
      role: 'provider',
      slug: 'the-modern-chef',
    });

    providerToken = 'Bearer ' + jwt.sign({ id: 'mock_provider' }, JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /api/domains/check', () => {
    it('should block unauthenticated check requests', async () => {
      const res = await request(app)
        .get('/api/domains/check?domain=myteststore.com');
      expect(res.status).toBe(401);
    });

    it('should return availability for a valid domain format', async () => {
      const res = await request(app)
        .get('/api/domains/check?domain=myteststore.com')
        .set('Authorization', providerToken);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('domain', 'myteststore.com');
      expect(res.body).toHaveProperty('available');
      expect(res.body).toHaveProperty('priceNGN', 25000);
    });

    it('should reject invalid domain formats with 400', async () => {
      const res = await request(app)
        .get('/api/domains/check?domain=invalid-domain')
        .set('Authorization', providerToken);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/domains/purchase', () => {
    it('should block unauthenticated purchase requests', async () => {
      const res = await request(app)
        .post('/api/domains/purchase')
        .send({
          domain: 'myteststore.com',
          reference: 'sim_paystack_ref_123',
          contactInfo: { firstName: 'Owner', lastName: 'Chef' }
        });
      expect(res.status).toBe(401);
    });

    it('should complete registration successfully via simulation fallback', async () => {
      const res = await request(app)
        .post('/api/domains/purchase')
        .set('Authorization', providerToken)
        .send({
          domain: 'myteststore.com',
          reference: 'sim_paystack_ref_123',
          contactInfo: {
            firstName: 'Owner',
            lastName: 'Chef',
            address: '123 Main St',
            city: 'Lagos',
            state: 'Lagos',
            postalCode: '100001',
            country: 'NG',
            phone: '+234.8123456789',
            email: 'provider@nile.ng'
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
    });
  });
});
