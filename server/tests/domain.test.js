import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { setMockMode, mockUsers } from '../utils/mockMode.js';
import { normalizeHostname, formatNamecheapPhone } from '../utils/domain.js';
import { buildQuote } from '../services/domain/domainPricing.js';
import { requirePremium } from '../middleware/entitlement.js';

const JWT_SECRET = process.env.JWT_SECRET;

const tokenFor = (id) => `Bearer ${jwt.sign({ id }, JWT_SECRET)}`;

const runGuard = (user) =>
  new Promise((resolve) => {
    const req = { user };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve({ status: this.statusCode, body });
      },
    };
    requirePremium(req, res, () => resolve({ status: 200, next: true }));
  });

describe('Domain validation and pricing', () => {
  it('normalises pasted URLs and lower-case hosts', () => {
    expect(normalizeHostname('https://WWW.Acme.COM/book?x=1').hostname).toBe('www.acme.com');
  });

  it('understands multi-label public suffixes', () => {
    const parsed = normalizeHostname('acme.co.uk');
    expect(parsed.hostname).toBe('acme.co.uk');
    expect(parsed.publicSuffix).toBe('co.uk');
    expect(parsed.registrable).toBe(true);
  });

  it('rejects IP addresses, incomplete names, and reserved hosts', () => {
    expect(() => normalizeHostname('127.0.0.1')).toThrow();
    expect(() => normalizeHostname('not-a-domain')).toThrow();
    expect(() => normalizeHostname('acme.local')).toThrow();
    expect(() => normalizeHostname('nilebooking.co')).toThrow();
  });

  it('formats Nigerian registrant phones for Namecheap', () => {
    expect(formatNamecheapPhone('08012345678', 'NG')).toBe('+234.8012345678');
    expect(formatNamecheapPhone('+234.8012345678', 'NG')).toBe('+234.8012345678');
  });

  it('keeps the first year included and adds capped 20% on renewal', async () => {
    const previous = {
      DOMAIN_FX_RATE: process.env.DOMAIN_FX_RATE,
      DOMAIN_DISPLAY_MARKUP: process.env.DOMAIN_DISPLAY_MARKUP,
      DOMAIN_CHECKOUT_MARKUP: process.env.DOMAIN_CHECKOUT_MARKUP,
      DOMAIN_CHECKOUT_MARKUP_CAP_NGN: process.env.DOMAIN_CHECKOUT_MARKUP_CAP_NGN,
    };
    process.env.DOMAIN_FX_RATE = '1000';
    process.env.DOMAIN_DISPLAY_MARKUP = '1.30';
    process.env.DOMAIN_CHECKOUT_MARKUP = '0.20';
    process.env.DOMAIN_CHECKOUT_MARKUP_CAP_NGN = '2000';

    try {
      const included = await buildQuote({ registrarUSD: 10, included: true });
      expect(included.priceNGN).toBe(0);
      expect(included.retailValueNGN).toBe(15000);

      const renewal = await buildQuote({ registrarUSD: 10, included: false });
      expect(renewal.priceNGN).toBe(15000);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe('Premium entitlement', () => {
  it('requires an active Premium provider', async () => {
    const result = await runGuard({ role: 'provider', plan: 'growth', planStatus: 'active' });
    expect(result.status).toBe(402);
    expect(result.body.code).toBe('PREMIUM_REQUIRED');
  });

  it('rejects customers even if the plan field is Premium', async () => {
    const result = await runGuard({ role: 'customer', plan: 'premium', planStatus: 'active' });
    expect(result.status).toBe(403);
  });

  it('allows a live Premium merchant', async () => {
    const result = await runGuard({ role: 'provider', plan: 'premium', planStatus: 'active' });
    expect(result.status).toBe(200);
    expect(result.next).toBe(true);
  });

  it('rejects an expired Premium plan', async () => {
    const result = await runGuard({
      role: 'provider',
      plan: 'premium',
      planStatus: 'active',
      planExpiresAt: new Date(Date.now() - 1000),
    });
    expect(result.status).toBe(402);
  });
});

describe('Domain routes', () => {
  beforeAll(() => {
    setMockMode(true);
    mockUsers.set('domain_premium', {
      _id: 'domain_premium',
      name: 'Premium Merchant',
      email: 'premium@nile.ng',
      role: 'provider',
      slug: 'premium-merchant',
      plan: 'premium',
      planStatus: 'active',
    });
    mockUsers.set('domain_growth', {
      _id: 'domain_growth',
      name: 'Growth Merchant',
      email: 'growth@nile.ng',
      role: 'provider',
      slug: 'growth-merchant',
      plan: 'growth',
      planStatus: 'active',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('blocks unauthenticated domain access', async () => {
    const res = await request(app).get('/api/domains');
    expect(res.status).toBe(401);
  });

  it('blocks non-Premium merchants from claiming a domain', async () => {
    const res = await request(app)
      .post('/api/domains/claim')
      .set('Authorization', tokenFor('domain_growth'))
      .send({ domain: 'growth-store.com' });

    expect(res.status).toBe(402);
    expect(res.body.code).toBe('PREMIUM_REQUIRED');
  });

  it('requires accurate registrant consent before contacting the registrar', async () => {
    const res = await request(app)
      .post('/api/domains/claim')
      .set('Authorization', tokenFor('domain_premium'))
      .send({ domain: 'premium-store.com', acceptedTerms: false });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DOMAIN_TERMS_REQUIRED');
  });

  it('returns a neutral 404 for an unknown custom host', async () => {
    const res = await request(app).get('/api/public/tenant?host=unknown-store.com');
    expect(res.status).toBe(404);
  });
});
