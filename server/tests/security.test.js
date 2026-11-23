import request from 'supertest';
import app from '../app.js';
import { validateRequiredSecrets, getJwtSecret } from '../config/secrets.js';
import { validateReceiptDataUrl, ReceiptValidationError } from '../utils/receipt.js';
import { setMockMode } from '../utils/mockMode.js';

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=';

describe('Fail-closed security configuration', () => {
  const originalJwt = process.env.JWT_SECRET;
  const originalAdmin = process.env.ADMIN_MASTER_KEY;

  afterEach(() => {
    process.env.JWT_SECRET = originalJwt;
    process.env.ADMIN_MASTER_KEY = originalAdmin;
  });

  it('rejects a missing JWT secret and never returns a fallback', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/required and has no fallback/i);
    expect(() => validateRequiredSecrets()).toThrow(/Refusing to start/i);
  });

  it('rejects a short admin key', () => {
    process.env.ADMIN_MASTER_KEY = 'too-short';
    expect(() => validateRequiredSecrets()).toThrow(/ADMIN_MASTER_KEY must be at least/i);
  });

  it('accepts the configured test secrets', () => {
    expect(() => validateRequiredSecrets()).not.toThrow();
  });
});

describe('CORS allowlist', () => {
  it('does not grant credentials to an arbitrary Vercel preview', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'https://attacker-preview.vercel.app')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('does not grant credentials to a LAN origin in test/non-production', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://192.168.1.8:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows an explicit local development origin outside production', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

describe('Health endpoint', () => {
  it('reports the database dependency in mock mode', async () => {
    setMockMode(true);
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.database).toBe('mock');
  });
});

describe('Receipt validation', () => {
  const originalMax = process.env.RECEIPT_MAX_BYTES;

  afterEach(() => {
    process.env.RECEIPT_MAX_BYTES = originalMax;
  });

  it('accepts a supported image data URL', () => {
    const result = validateReceiptDataUrl(tinyPng);
    expect(result.mimeType).toBe('image/png');
    expect(result.bytes).toBeGreaterThan(0);
  });

  it('rejects an SVG or arbitrary data URL', () => {
    expect(() => validateReceiptDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='))
      .toThrow(ReceiptValidationError);
  });

  it('rejects a decoded payload over the configured limit', () => {
    process.env.RECEIPT_MAX_BYTES = '4';
    expect(() => validateReceiptDataUrl(tinyPng)).toThrow(/exceeds/i);
  });
});
