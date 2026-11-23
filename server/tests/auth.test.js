import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { setMockMode, mockUsers } from '../utils/mockMode.js';

jest.setTimeout(30000);

const makeMockUser = (email, otpExpires) => {
  const user = {
    _id: `mock_otp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: 'OTP Test Merchant',
    email,
    role: 'provider',
    slug: `otp-test-${Date.now()}`,
    businessName: 'OTP Test Merchant',
    isVerified: false,
    otpCode: '123456',
    otpExpires,
    comparePassword: async (candidate) => candidate === 'password123',
  };
  mockUsers.set(email, user);
  return user;
};

describe('registration OTP verification', () => {
  beforeAll(() => {
    setMockMode(true);
  });

  it('rejects an expired registration code without verifying the account', async () => {
    const email = `expired-otp-${Date.now()}@example.com`;
    const user = makeMockUser(email, new Date(Date.now() - 1000));

    const response = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email, otpCode: '123456' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid or expired/i);
    expect(user.isVerified).toBe(false);
    expect(user.otpCode).toBeNull();
    expect(user.otpExpires).toBeNull();
  });

  it('accepts a current registration code and clears it', async () => {
    const email = `current-otp-${Date.now()}@example.com`;
    const user = makeMockUser(email, new Date(Date.now() + 60 * 1000));

    const response = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email, otpCode: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(user.isVerified).toBe(true);
    expect(user.otpCode).toBeNull();
    expect(user.otpExpires).toBeNull();
  });
});
