import { jest } from '@jest/globals';

const axios = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: axios }));
const { attachDomain, describeDomain, isVercelConfigured } = await import('../services/domain/vercelClient.js');

const envKeys = ['VERCEL', 'VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_TEAM_ID', 'NILE_STOREFRONT_PROJECT_ID'];
let original;
beforeEach(() => {
  original = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  axios.mockReset();
  process.env.VERCEL = '1';
  process.env.VERCEL_TOKEN = 'test-only-token';
  process.env.VERCEL_PROJECT_ID = 'prj_backend';
  process.env.NILE_STOREFRONT_PROJECT_ID = 'prj_storefront';
  process.env.VERCEL_TEAM_ID = 'team_test';
});
afterEach(() => {
  for (const key of envKeys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

it('targets the explicit storefront project, not the backend system project ID', async () => {
  axios.mockResolvedValue({ data: { name: 'example.com', verified: true } });
  await attachDomain('example.com');
  expect(axios.mock.calls[0][0].url).toBe('https://api.vercel.com/v9/projects/prj_storefront/domains/example.com?teamId=team_test');
});

it('fails closed when only the backend system project ID is present on Vercel', async () => {
  delete process.env.NILE_STOREFRONT_PROJECT_ID;
  expect(isVercelConfigured()).toBe(false);
  await expect(attachDomain('example.com')).rejects.toMatchObject({ code: 'VERCEL_NOT_CONFIGURED' });
  expect(axios).not.toHaveBeenCalled();
});

it('keeps the legacy project setting for local integrations', async () => {
  delete process.env.VERCEL;
  delete process.env.NILE_STOREFRONT_PROJECT_ID;
  axios.mockResolvedValue({ data: { name: 'example.com' } });
  await attachDomain('example.com');
  expect(axios.mock.calls[0][0].url).toContain('/projects/prj_backend/domains/');
});

it('creates a missing domain on the storefront project', async () => {
  axios.mockRejectedValueOnce({ response: { status: 404 } })
    .mockResolvedValueOnce({ data: { name: 'example.com', verified: true } });
  await expect(attachDomain('example.com')).resolves.toMatchObject({ verified: true });
  expect(axios.mock.calls[1][0]).toMatchObject({ method: 'POST', data: { name: 'example.com' } });
  expect(axios.mock.calls[1][0].url).toContain('/v10/projects/prj_storefront/domains');
});

it('does not disguise a failed domain creation as pending DNS', async () => {
  axios.mockRejectedValue({ response: { status: 404, data: { error: { message: 'Project not found' } } } });
  await expect(attachDomain('example.com')).rejects.toMatchObject({ code: 'VERCEL_DOMAIN_ERROR', message: 'Project not found' });
});

it('surfaces token permission failures instead of returning unattached', async () => {
  axios.mockRejectedValue({ response: { status: 403, data: { error: { message: 'Not authorized' } } } });
  await expect(describeDomain('example.com')).rejects.toMatchObject({ code: 'VERCEL_DOMAIN_ERROR', message: 'Not authorized' });
});
