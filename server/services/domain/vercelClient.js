import axios from 'axios';

export class VercelNotConfiguredError extends Error {
  constructor() {
    super('Custom-domain hosting requires VERCEL_TOKEN and NILE_STOREFRONT_PROJECT_ID for the storefront project.');
    this.name = 'VercelNotConfiguredError';
    this.code = 'VERCEL_NOT_CONFIGURED';
  }
}

// VERCEL_PROJECT_ID identifies this API deployment on Vercel, not the client.
// Only retain the legacy name for integrations running outside Vercel.
const storefrontProjectId = () =>
  process.env.NILE_STOREFRONT_PROJECT_ID?.trim() ||
  (!process.env.VERCEL ? process.env.VERCEL_PROJECT_ID?.trim() : null);

const config = () => {
  const token = process.env.VERCEL_TOKEN;
  const projectId = storefrontProjectId();
  if (!token || !projectId) throw new VercelNotConfiguredError();
  return {
    token,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID || null,
  };
};

export const isVercelConfigured = () =>
  Boolean(process.env.VERCEL_TOKEN && storefrontProjectId());

const request = async (method, path, data, { allowMissing = false } = {}) => {
  const { token, projectId, teamId } = config();
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  try {
    const response = await axios({
      method,
      url: `https://api.vercel.com${path.replace('{project}', projectId)}${query}`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    });
    return response.data;
  } catch (error) {
    if (allowMissing && error.response?.status === 404) return null;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      'Vercel could not update the domain.';
    const wrapped = new Error(message);
    wrapped.statusCode = error.response?.status || 502;
    wrapped.code = 'VERCEL_DOMAIN_ERROR';
    throw wrapped;
  }
};

const normaliseVerification = (domain) =>
  (domain?.verification || []).map((record) => ({
    type: record.type || 'TXT',
    host: record.domain || domain?.name,
    value: record.value,
  }));

export const attachDomain = async (hostname) => {
  const existing = await getDomain(hostname);
  if (existing) return existing;

  const created = await request('POST', '/v10/projects/{project}/domains', { name: hostname });
  return created;
};

export const getDomain = async (hostname) =>
  request('GET', `/v9/projects/{project}/domains/${encodeURIComponent(hostname)}`, undefined, { allowMissing: true });

export const verifyDomain = async (hostname) => {
  const result = await request(
    'POST',
    `/v9/projects/{project}/domains/${encodeURIComponent(hostname)}/verify`
  );
  return result;
};

export const detachDomain = async (hostname) =>
  request('DELETE', `/v9/projects/{project}/domains/${encodeURIComponent(hostname)}`);

export const describeDomain = async (hostname) => {
  const domain = await getDomain(hostname);
  if (!domain) return { attached: false, verified: false, misconfigured: false, verificationRecords: [] };
  return {
    attached: true,
    verified: Boolean(domain.verified),
    misconfigured: Boolean(domain.misconfigured),
    verificationRecords: normaliseVerification(domain),
  };
};

export const normaliseVercelVerification = normaliseVerification;
