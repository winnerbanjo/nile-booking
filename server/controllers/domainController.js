import {
  checkAvailability,
  claimDomain,
  connectDomain,
  detachDomain,
  getMerchantDomain,
  initializeRenewal,
  listMerchantDomains,
  refreshDomain,
  resolvePublicTenant,
  retryDomain,
  runDomainMaintenance,
  serializeMerchantDomain,
  suggestDomains,
  verifyConnectedDomain,
  verifyRenewalReturn,
} from '../services/domain/domainService.js';
import { DomainProviderError } from '../services/domain/namecheapClient.js';
import { DomainValidationError } from '../utils/domain.js';
import { isPremiumMerchant } from '../middleware/entitlement.js';
import { getMockMode } from '../utils/mockMode.js';

const fail = (res, error) => {
  const status =
    error.statusCode ||
    (error instanceof DomainProviderError ? error.statusCode : null) ||
    500;
  return res.status(status).json({
    message: error.message || 'Domain request failed.',
    code: error.code || 'DOMAIN_ERROR',
    ...(error.details ? { details: error.details } : {}),
  });
};

const premiumState = (user) => ({
  isPremium: isPremiumMerchant(user),
  plan: user?.plan || 'none',
  planStatus: user?.planStatus || 'active',
  planExpiresAt: user?.planExpiresAt || null,
});

export const getDomainOverview = async (req, res) => {
  try {
    const domains = await listMerchantDomains(req.user._id);
    res.json({
      ...premiumState(req.user),
      domains: domains.map((domain) => serializeMerchantDomain(domain)),
      limits: { includedDomains: 1, activeDomains: domains.filter((domain) => domain.active).length },
    });
  } catch (error) {
    fail(res, error);
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const suggestions = await suggestDomains(req.body?.keyword);
    res.json({ suggestions });
  } catch (error) {
    fail(res, error);
  }
};

export const getAvailability = async (req, res) => {
  try {
    const availability = await checkAvailability(req.body?.domain || req.body?.keyword);
    res.json(availability);
  } catch (error) {
    fail(res, error);
  }
};

export const claimIncludedDomain = async (req, res) => {
  try {
    const domain = await claimDomain({
      merchant: req.user,
      domain: req.body?.domain,
      registrant: req.body?.registrant,
      acceptedTerms: Boolean(req.body?.acceptedTerms),
    });
    res.status(201).json({
      success: true,
      message:
        domain.status === 'ACTIVE'
          ? 'Your domain is registered and live.'
          : 'Your domain is registered. We are finishing the DNS and hosting connection.',
      domain: serializeMerchantDomain(domain),
    });
  } catch (error) {
    fail(res, error);
  }
};

export const connectExistingDomain = async (req, res) => {
  try {
    const domain = await connectDomain({
      merchant: req.user,
      domain: req.body?.domain,
    });
    res.status(201).json({
      success: true,
      message: 'Add the TXT record below, then verify the domain.',
      domain: serializeMerchantDomain(domain),
    });
  } catch (error) {
    fail(res, error);
  }
};

export const verifyDomainOwnership = async (req, res) => {
  try {
    const domain = await verifyConnectedDomain({
      merchantId: req.user._id,
      domainId: req.params.id,
    });
    res.json({
      success: true,
      message:
        domain.status === 'ACTIVE'
          ? 'Domain connected successfully.'
          : 'Ownership verified. Waiting for DNS and hosting to finish.',
      domain: serializeMerchantDomain(domain),
    });
  } catch (error) {
    fail(res, error);
  }
};

export const refreshDomainStatus = async (req, res) => {
  try {
    const domain = await refreshDomain({
      merchantId: req.user._id,
      domainId: req.params.id,
    });
    res.json({ success: true, domain: serializeMerchantDomain(domain) });
  } catch (error) {
    fail(res, error);
  }
};

export const retryDomainSetup = async (req, res) => {
  try {
    const domain = await retryDomain({
      merchantId: req.user._id,
      domainId: req.params.id,
    });
    res.json({ success: true, domain: serializeMerchantDomain(domain) });
  } catch (error) {
    fail(res, error);
  }
};

export const renewDomainNow = async (req, res) => {
  try {
    const result = await initializeRenewal({
      merchant: req.user,
      domainId: req.params.id,
    });
    res.json({
      success: true,
      reference: result.reference,
      amountNGN: result.amountNGN,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      domain: result.domain,
    });
  } catch (error) {
    fail(res, error);
  }
};

export const verifyRenewalPayment = async (req, res) => {
  try {
    const result = await verifyRenewalReturn({
      merchantId: req.user._id,
      reference: req.body?.reference,
    });
    res.json(result);
  } catch (error) {
    fail(res, error);
  }
};

export const removeDomain = async (req, res) => {
  try {
    const domain = await detachDomain({
      merchantId: req.user._id,
      domainId: req.params.id,
    });
    res.json({ success: true, domain: serializeMerchantDomain(domain) });
  } catch (error) {
    fail(res, error);
  }
};

export const getMyDomain = async (req, res) => {
  try {
    const domain = await getMerchantDomain(req.user._id, req.params.id);
    res.json({ domain: serializeMerchantDomain(domain) });
  } catch (error) {
    fail(res, error);
  }
};

export const getPublicTenant = async (req, res) => {
  try {
    if (getMockMode()) {
      return res.status(404).json({ message: 'No storefront is configured for this domain.' });
    }
    const tenant = await resolvePublicTenant(req.query.host);
    if (!tenant) {
      return res.status(404).json({ message: 'No storefront is configured for this domain.' });
    }
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(tenant);
  } catch {
    res.status(404).json({ message: 'No storefront is configured for this domain.' });
  }
};

export const runDomainCron = async (req, res) => {
  try {
    const result = await runDomainMaintenance();
    res.json({ success: true, ...result });
  } catch (error) {
    fail(res, error);
  }
};
