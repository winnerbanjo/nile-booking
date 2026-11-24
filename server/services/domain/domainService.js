import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import User from '../../models/User.js';
import CustomDomain from '../../models/CustomDomain.js';
import DomainPayment from '../../models/DomainPayment.js';
import {
  DomainValidationError,
  decryptJson,
  encryptJson,
  normalizeHostname,
} from '../../utils/domain.js';
import {
  DomainProviderError,
  assertNamecheapConfigured,
  checkDomains,
  createDomain,
  getDomainInfo,
  getTldPriceUSD,
  renewDomain,
  setHosts,
} from './namecheapClient.js';
import {
  attachDomain,
  describeDomain,
  detachDomain as detachVercelDomain,
  isVercelConfigured,
} from './vercelClient.js';
import { buildQuote } from './domainPricing.js';
import { sendMailtrapApiEmail } from '../notificationService.js';
import { paystackService } from '../paymentService.js';
import { logEvent } from '../../utils/logger.js';

const SUGGESTED_TLDS = ['store', 'shop'];
const RESERVED_DOMAIN = /(^|\.)nilebooking\.(co|com)$/i;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const publicDnsRecords = () => [
  {
    type: 'A',
    host: '@',
    value: process.env.DOMAIN_APEX_IP || '76.76.21.21',
    ttl: 3600,
    status: 'pending',
  },
  {
    type: 'CNAME',
    host: 'www',
    value: process.env.DOMAIN_WWW_CNAME || 'cname.vercel-dns.com',
    ttl: 3600,
    status: 'pending',
  },
];

const serializeDomain = (doc) => {
  if (!doc) return null;
  const value = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  delete value.registrantEncrypted;
  delete value.__v;
  return value;
};

const notifyMerchant = async (user, subject, htmlContent, category) => {
  if (!user?.email) return { success: false, error: 'Merchant has no email address' };
  try {
    return await sendMailtrapApiEmail({
      toEmail: user.email,
      toName: user.businessName || user.name || 'Merchant',
      subject,
      htmlContent,
      category,
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const domainEmailShell = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#18181b;">
    <h2 style="margin:0 0 10px;">${escapeHtml(title)}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#a1a1aa;">Nile Booking · Domains</p>
  </div>
`;

const validateRegistrant = (registrant) => {
  const required = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['address', 'Street address'],
    ['city', 'City'],
    ['state', 'State or region'],
    ['postalCode', 'Postal code'],
    ['country', 'Country'],
    ['phone', 'Phone number'],
    ['email', 'Email address'],
  ];

  const missing = required.filter(([key]) => !String(registrant?.[key] || '').trim());
  if (missing.length > 0) {
    throw new DomainValidationError(
      `Complete the registrant details: ${missing.map(([, label]) => label).join(', ')}.`,
      'REGISTRANT_INCOMPLETE'
    );
  }

  const email = String(registrant.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainValidationError('Enter a valid registrant email address.', 'REGISTRANT_EMAIL_INVALID');
  }
  const country = String(registrant.country).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new DomainValidationError('Use a two-letter country code, for example NG.', 'REGISTRANT_COUNTRY_INVALID');
  }

  return {
    firstName: String(registrant.firstName).trim(),
    lastName: String(registrant.lastName).trim(),
    company: String(registrant.company || '').trim(),
    address: String(registrant.address).trim(),
    city: String(registrant.city).trim(),
    state: String(registrant.state).trim(),
    postalCode: String(registrant.postalCode).trim(),
    country,
    phone: String(registrant.phone).trim(),
    email,
  };
};

const syncMerchantMirror = async (domainDoc) => {
  if (domainDoc.active) {
    try {
      await User.updateOne(
        { _id: domainDoc.merchant },
        { $set: { customDomain: domainDoc.domain } }
      );
    } catch (error) {
      if (error.code !== 11000) {
        logEvent('domain_mirror_failed', {
          domain: domainDoc.domain,
          merchantId: String(domainDoc.merchant),
          error: error.message,
        });
      }
    }
  }
};

const clearMerchantMirror = async (domainDoc) => {
  try {
    await User.updateOne(
      { _id: domainDoc.merchant, customDomain: domainDoc.domain },
      { $unset: { customDomain: 1 } }
    );
  } catch {
    // Mirror cleanup is best-effort; CustomDomain remains authoritative.
  }
};

const hostingTargets = (hostname) =>
  hostname.startsWith('www.') ? [hostname] : [hostname, `www.${hostname}`];

const plain = (value) => (value?.toObject ? value.toObject() : value || {});

const attachAndCheckHosting = async (hostname) => {
  if (!isVercelConfigured()) {
    return {
      configured: false,
      attached: false,
      verified: false,
      misconfigured: false,
      verificationRecords: [],
    };
  }

  let attached = false;
  let verified = true;
  let misconfigured = false;
  const verificationRecords = [];

  for (const target of hostingTargets(hostname)) {
    const result = await attachDomain(target);
    if (result) attached = true;
    const status = await describeDomain(target);
    verified = verified && status.verified;
    misconfigured = misconfigured || status.misconfigured;
    verificationRecords.push(...(status.verificationRecords || []));
  }

  return {
    configured: true,
    attached,
    verified: attached && verified,
    misconfigured,
    verificationRecords,
  };
};

const activateIfReady = async (domainDoc) => {
  const hosting = await attachAndCheckHosting(domainDoc.domain);
  domainDoc.hosting = {
    provider: 'vercel',
    attached: hosting.attached,
    verified: hosting.verified,
    misconfigured: hosting.misconfigured,
    verificationRecords: hosting.verificationRecords,
    checkedAt: new Date(),
  };

  if (hosting.verified && !hosting.misconfigured) {
    domainDoc.status = 'ACTIVE';
    domainDoc.active = true;
    domainDoc.locked = false;
    domainDoc.failureReason = null;
    domainDoc.dnsRecords = domainDoc.dnsRecords.map((record) => ({
      ...plain(record),
      status: 'verified',
    }));
  } else {
    domainDoc.status = 'DNS_PENDING';
    domainDoc.active = false;
    domainDoc.failureReason = hosting.configured
      ? 'Waiting for the domain to finish pointing at Nile hosting. This can take a few minutes.'
      : 'DNS is set. Hosting activation is pending until Vercel credentials are configured.';
  }

  await domainDoc.save();
  await syncMerchantMirror(domainDoc);
  return domainDoc;
};

const markFailed = async (domainDoc, error) => {
  domainDoc.status = 'FAILED';
  domainDoc.active = false;
  domainDoc.locked = false;
  domainDoc.failureReason = error.message || 'Domain provisioning failed.';
  await domainDoc.save();
  await clearMerchantMirror(domainDoc);
};

export const listMerchantDomains = async (merchantId) => {
  const domains = await CustomDomain.find({ merchant: merchantId, status: { $ne: 'REMOVED' } })
    .sort({ createdAt: -1 })
    .lean();
  return domains.map((domain) => {
    delete domain.registrantEncrypted;
    return domain;
  });
};

export const getMerchantDomain = async (merchantId, domainId) => {
  const domain = await CustomDomain.findOne({ _id: domainId, merchant: merchantId });
  if (!domain) {
    const error = new Error('Domain not found.');
    error.statusCode = 404;
    error.code = 'DOMAIN_NOT_FOUND';
    throw error;
  }
  return domain;
};

export const suggestDomains = async (keyword) => {
  const clean = String(keyword || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  if (clean.length < 2) {
    throw new DomainValidationError('Enter at least two characters to search.', 'DOMAIN_KEYWORD_TOO_SHORT');
  }

  const candidates = SUGGESTED_TLDS.map((tld) => `${clean}.${tld}`);
  const results = await checkDomains(candidates);
  const byDomain = new Map(results.map((result) => [result.domain, result]));
  const suggestions = [];

  for (const candidate of candidates) {
    const result = byDomain.get(candidate);
    if (!result?.available) continue;
    const tld = candidate.split('.').pop();
    const registrarUSD = result.isPremium && result.premiumRegistrationPrice
      ? result.premiumRegistrationPrice
      : await getTldPriceUSD(tld, 'REGISTER');
    const quote = await buildQuote({ registrarUSD, included: true });
    suggestions.push({
      domain: candidate,
      available: true,
      included: true,
      isPremiumDomain: Boolean(result.isPremium),
      priceNGN: 0,
      retailValueNGN: quote.retailValueNGN,
      priceUSD: quote.registrarUSD,
      description: result.description || '',
      quoteRequired: Boolean(result.isPremium),
    });
  }

  return suggestions;
};

export const checkAvailability = async (input) => {
  const { hostname } = normalizeHostname(input);
  if (RESERVED_DOMAIN.test(hostname)) {
    throw new DomainValidationError('That domain cannot be registered through Nile Booking.', 'DOMAIN_RESERVED');
  }

  const [result] = await checkDomains([hostname]);
  if (!result || result.domain !== hostname) {
    throw new DomainProviderError('The registrar did not return a result for that domain.', {
      code: 'DOMAIN_CHECK_EMPTY',
      retryable: true,
    });
  }

  const publicSuffix = normalizeHostname(hostname).publicSuffix;
  const registrarUSD = result.isPremium && result.premiumRegistrationPrice
    ? result.premiumRegistrationPrice
    : await getTldPriceUSD(publicSuffix, 'REGISTER');
  const quote = await buildQuote({ registrarUSD, included: true });

  return {
    domain: hostname,
    available: result.available,
    included: true,
    isPremiumDomain: Boolean(result.isPremium),
    priceNGN: 0,
    retailValueNGN: quote.retailValueNGN,
    priceUSD: quote.registrarUSD,
    markupNGN: quote.markupNGN,
    fxRate: quote.fxRate,
    quoteRequired: Boolean(result.isPremium),
    description: result.description || '',
  };
};

const ensureNoOtherDomain = async (merchantId, hostname) => {
  const existing = await CustomDomain.findOne({
    merchant: merchantId,
    ...(hostname ? { domain: { $ne: hostname } } : {}),
    $or: [
      { status: { $nin: ['FAILED', 'REMOVED'] } },
      { 'registration.registeredAt': { $ne: null } },
    ],
  });
  if (existing) {
    const error = new Error(
      `Your Premium plan includes one domain. ${existing.domain} is already on this account.`
    );
    error.statusCode = 409;
    error.code = 'DOMAIN_ALREADY_ACTIVE';
    throw error;
  }
};

export const claimDomain = async ({ merchant, domain: input, registrant, acceptedTerms }) => {
  if (!acceptedTerms) {
    throw new DomainValidationError(
      'Confirm that the registrant details are accurate and accept the domain terms.',
      'DOMAIN_TERMS_REQUIRED'
    );
  }

  const { hostname, registrable } = normalizeHostname(input);
  if (!registrable) {
    throw new DomainValidationError(
      'Enter the main domain only, for example yourbusiness.com.',
      'DOMAIN_NOT_REGISTRABLE'
    );
  }
  if (RESERVED_DOMAIN.test(hostname)) {
    throw new DomainValidationError('That domain cannot be registered through Nile Booking.', 'DOMAIN_RESERVED');
  }

  assertNamecheapConfigured();
  await ensureNoOtherDomain(merchant._id, hostname);

  let domainDoc = await CustomDomain.findOne({ domain: hostname }).select('+registrantEncrypted');
  if (domainDoc && String(domainDoc.merchant) !== String(merchant._id)) {
    const error = new Error('That domain is already connected to another Nile Booking store.');
    error.statusCode = 409;
    error.code = 'DOMAIN_TAKEN';
    throw error;
  }
  if (domainDoc && !['FAILED', 'REMOVED'].includes(domainDoc.status)) {
    const error = new Error('That domain is already being set up on your account.');
    error.statusCode = 409;
    error.code = 'DOMAIN_IN_PROGRESS';
    throw error;
  }
  if (domainDoc?.registration?.registeredAt) {
    const error = new Error('That domain is already registered on your account. Manage it from the domain card instead.');
    error.statusCode = 409;
    error.code = 'DOMAIN_ALREADY_OWNED';
    throw error;
  }

  const availability = await checkAvailability(hostname);
  if (!availability.available) {
    const error = new Error('That domain is no longer available.');
    error.statusCode = 409;
    error.code = 'DOMAIN_UNAVAILABLE';
    throw error;
  }
  if (availability.isPremiumDomain) {
    const error = new Error(
      'Premium-priced domain names are not included in the Premium plan. Contact support for a quote.'
    );
    error.statusCode = 400;
    error.code = 'PREMIUM_DOMAIN_NOT_INCLUDED';
    throw error;
  }

  const sanitizedRegistrant = validateRegistrant(registrant);
  const quote = await buildQuote({ registrarUSD: availability.priceUSD, included: true });

  if (!domainDoc) {
    domainDoc = new CustomDomain({
      merchant: merchant._id,
      domain: hostname,
      source: 'purchased',
    });
  }

  domainDoc.status = 'PENDING_REGISTRATION';
  domainDoc.active = false;
  domainDoc.locked = true;
  domainDoc.failureReason = null;
  domainDoc.priceUSD = availability.priceUSD;
  domainDoc.priceNGN = 0;
  domainDoc.fxRate = quote.fxRate;
  domainDoc.isPremiumDomain = false;
  domainDoc.years = 1;
  domainDoc.registrantEncrypted = encryptJson(sanitizedRegistrant);
  domainDoc.registration = {
    ...plain(domainDoc.registration),
    autoRenew: false,
  };
  domainDoc.dnsRecords = publicDnsRecords();
  await domainDoc.save();

  try {
    return await provisionPurchasedDomain(domainDoc._id, merchant);
  } catch (error) {
    const fresh = await CustomDomain.findById(domainDoc._id).select('+registrantEncrypted');
    if (fresh) await markFailed(fresh, error);
    throw error;
  }
};

export const provisionPurchasedDomain = async (domainId, merchant = null) => {
  const claimed = await CustomDomain.findOneAndUpdate(
    {
      _id: domainId,
      status: { $in: ['PENDING_REGISTRATION', 'FAILED'] },
    },
    {
      $set: {
        status: 'REGISTERING',
        active: false,
        failureReason: null,
        lastCheckedAt: new Date(),
      },
      $inc: { attempts: 1 },
    },
    { new: true }
  ).select('+registrantEncrypted');

  if (!claimed) {
    const current = await CustomDomain.findById(domainId);
    if (!current) {
      const error = new Error('Domain not found.');
      error.statusCode = 404;
      throw error;
    }
    return current;
  }

  const contact = decryptJson(claimed.registrantEncrypted);
  if (!contact) {
    const error = new Error('The registrant details could not be read. Contact support.');
    error.statusCode = 500;
    error.code = 'REGISTRANT_UNREADABLE';
    await markFailed(claimed, error);
    throw error;
  }

  let registration;
  try {
    registration = await createDomain({
      domain: claimed.domain,
      years: claimed.years || 1,
      contact,
    });
  } catch (error) {
    await markFailed(claimed, error);
    throw error;
  }

  let expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + (claimed.years || 1));
  try {
    const info = await getDomainInfo(claimed.domain);
    if (info.expiryDate) expiryDate = info.expiryDate;
  } catch {
    // Registration is confirmed. Expiry is retried by the maintenance job.
  }

  claimed.status = 'REGISTERED';
  claimed.registration = {
    orderId: registration.orderId || null,
    registeredAt: new Date(),
    expiryDate,
    autoRenew: false,
    nameservers: claimed.registration?.nameservers || [],
  };
  await claimed.save();

  const merchantUser = merchant || (await User.findById(claimed.merchant));
  await notifyMerchant(
    merchantUser,
    `Your domain ${claimed.domain} is registered`,
    domainEmailShell(
      'Your domain is registered',
      `<p>We registered <strong>${escapeHtml(claimed.domain)}</strong> as part of your Premium plan.</p>
       <p>We are now finishing the DNS and hosting connection. No payment is due for the first year.</p>
       <p>Your registrant email may receive a verification request from the registrar. Please complete it to keep the domain active.</p>`
    ),
    'Domain Registration'
  );

  try {
    await setHosts({ domain: claimed.domain, records: publicDnsRecords() });
    return await activateIfReady(claimed);
  } catch (error) {
    // The registration succeeded and must not be retried. DNS/hosting problems
    // are recoverable from the domain dashboard and the maintenance cron.
    claimed.status = 'DNS_PENDING';
    claimed.active = false;
    claimed.failureReason = error.message || 'DNS configuration is pending.';
    await claimed.save();
    return claimed;
  }
};

export const retryDomain = async ({ merchantId, domainId }) => {
  const domainDoc = await getMerchantDomain(merchantId, domainId);

  if (domainDoc.source === 'purchased' && ['FAILED', 'PENDING_REGISTRATION'].includes(domainDoc.status)) {
    if (domainDoc.registration?.registeredAt) {
      try {
        await setHosts({ domain: domainDoc.domain, records: publicDnsRecords() });
        return await activateIfReady(domainDoc);
      } catch (error) {
        domainDoc.status = 'DNS_PENDING';
        domainDoc.active = false;
        domainDoc.failureReason = error.message || 'DNS configuration is pending.';
        await domainDoc.save();
        return domainDoc;
      }
    }
    return provisionPurchasedDomain(domainDoc._id);
  }

  if (['REGISTERED', 'DNS_PENDING', 'PENDING_VERIFICATION', 'CONNECTING'].includes(domainDoc.status)) {
    if (domainDoc.source === 'connected') {
      return verifyConnectedDomain({ merchantId, domainId });
    }
    return activateIfReady(domainDoc);
  }

  return domainDoc;
};

export const connectDomain = async ({ merchant, domain: input }) => {
  const { hostname } = normalizeHostname(input);
  if (RESERVED_DOMAIN.test(hostname)) {
    throw new DomainValidationError('That domain cannot be connected to Nile Booking.', 'DOMAIN_RESERVED');
  }

  await ensureNoOtherDomain(merchant._id, hostname);

  const existing = await CustomDomain.findOne({ domain: hostname });
  if (existing && existing.source === 'purchased' && existing.registration?.registeredAt) {
    const error = new Error('That domain was registered through Nile Booking. Manage it from the domain card instead.');
    error.statusCode = 409;
    error.code = 'DOMAIN_ALREADY_OWNED';
    throw error;
  }
  if (existing && String(existing.merchant) !== String(merchant._id)) {
    const error = new Error('That domain is already connected to another Nile Booking store.');
    error.statusCode = 409;
    error.code = 'DOMAIN_TAKEN';
    throw error;
  }
  if (existing && existing.active) {
    const error = new Error('That domain is already active on your account.');
    error.statusCode = 409;
    error.code = 'DOMAIN_ALREADY_ACTIVE';
    throw error;
  }

  const token = crypto.randomBytes(24).toString('hex');
  const verificationRecord = {
    type: 'TXT',
    host: `_nilebooking.${hostname}`,
    value: `nile-verify=${token}`,
  };

  const domainDoc = existing || new CustomDomain({ merchant: merchant._id, domain: hostname });
  domainDoc.source = 'connected';
  domainDoc.status = 'PENDING_VERIFICATION';
  domainDoc.active = false;
  domainDoc.locked = false;
  domainDoc.failureReason = null;
  domainDoc.verificationToken = token;
  domainDoc.verificationRecord = verificationRecord;
  domainDoc.dnsRecords = [
    verificationRecord,
    ...publicDnsRecords(),
  ];
  await domainDoc.save();

  return domainDoc;
};

const txtContainsToken = async (hostname, token) => {
  try {
    const records = await dns.resolveTxt(`_nilebooking.${hostname}`);
    return records
      .map((parts) => parts.join(''))
      .some((value) => value.includes(`nile-verify=${token}`));
  } catch {
    return false;
  }
};

export const verifyConnectedDomain = async ({ merchantId, domainId }) => {
  const domainDoc = await getMerchantDomain(merchantId, domainId);
  if (domainDoc.source !== 'connected') {
    const error = new Error('This domain was registered by Nile Booking, so there is no TXT record to verify.');
    error.statusCode = 400;
    error.code = 'DOMAIN_NOT_CONNECTED';
    throw error;
  }

  const verified = domainDoc.verificationToken
    ? await txtContainsToken(domainDoc.domain, domainDoc.verificationToken)
    : false;

  if (!verified) {
    const error = new Error(
      `We could not find the TXT record yet. Add ${domainDoc.verificationRecord?.value || 'the verification record'} at ${domainDoc.verificationRecord?.host || `_nilebooking.${domainDoc.domain}`} and try again.`
    );
    error.statusCode = 409;
    error.code = 'DOMAIN_TXT_NOT_FOUND';
    throw error;
  }

  domainDoc.status = 'CONNECTING';
  domainDoc.dnsRecords = (domainDoc.dnsRecords || []).map((record) => ({
    ...plain(record),
    status: record.type === 'TXT' ? 'verified' : record.status,
  }));
  await domainDoc.save();

  return activateIfReady(domainDoc);
};

export const refreshDomain = async ({ merchantId, domainId }) => {
  const domainDoc = await getMerchantDomain(merchantId, domainId);

  if (domainDoc.source === 'connected' && domainDoc.status === 'PENDING_VERIFICATION') {
    return verifyConnectedDomain({ merchantId, domainId });
  }

  if (domainDoc.registration?.expiryDate && new Date(domainDoc.registration.expiryDate) < new Date()) {
    domainDoc.status = 'EXPIRED';
    domainDoc.active = false;
    await domainDoc.save();
    await clearMerchantMirror(domainDoc);
    return domainDoc;
  }

  if (['REGISTERED', 'DNS_PENDING', 'ACTIVE', 'CONNECTING'].includes(domainDoc.status)) {
    const hosting = await describeDomain(domainDoc.domain).catch(() => null);
    if (hosting) {
      domainDoc.hosting = {
        provider: 'vercel',
        attached: hosting.attached,
        verified: hosting.verified,
        misconfigured: hosting.misconfigured,
        verificationRecords: hosting.verificationRecords,
        checkedAt: new Date(),
      };
      if (hosting.verified && !hosting.misconfigured) {
        domainDoc.status = 'ACTIVE';
        domainDoc.active = true;
        domainDoc.locked = false;
        domainDoc.failureReason = null;
      } else if (domainDoc.status !== 'ACTIVE') {
        domainDoc.status = 'DNS_PENDING';
        domainDoc.failureReason = 'Waiting for DNS and hosting verification.';
      } else {
        domainDoc.failureReason =
          'Hosting configuration needs attention. Check the DNS records or contact support.';
      }
      await domainDoc.save();
      await syncMerchantMirror(domainDoc);
    }
  }

  return domainDoc;
};

export const detachDomain = async ({ merchantId, domainId }) => {
  const domainDoc = await getMerchantDomain(merchantId, domainId);

  for (const target of hostingTargets(domainDoc.domain)) {
    try {
      await detachVercelDomain(target);
    } catch (error) {
      logEvent('domain_detach_failed', {
        domain: target,
        merchantId: String(merchantId),
        error: error.message,
      });
    }
  }

  domainDoc.status = 'REMOVED';
  domainDoc.active = false;
  domainDoc.locked = false;
  await domainDoc.save();
  await clearMerchantMirror(domainDoc);
  return domainDoc;
};

export const quoteRenewal = async (domainDoc) => {
  const { publicSuffix } = normalizeHostname(domainDoc.domain);
  const registrarUSD = await getTldPriceUSD(publicSuffix, 'RENEW');
  const quote = await buildQuote({ registrarUSD, included: false });
  return {
    ...quote,
    durationYears: 1,
  };
};

export const initializeRenewal = async ({ merchant, domainId }) => {
  assertNamecheapConfigured();
  if (!process.env.PAYSTACK_SECRET_KEY) {
    const error = new Error('Renewal payments are temporarily unavailable. Please contact support.');
    error.statusCode = 503;
    error.code = 'RENEWAL_PAYMENT_NOT_CONFIGURED';
    throw error;
  }

  const domainDoc = await getMerchantDomain(merchant._id, domainId);
  if (!['ACTIVE', 'DNS_PENDING', 'REGISTERED', 'EXPIRED'].includes(domainDoc.status)) {
    const error = new Error('This domain is not ready for renewal yet.');
    error.statusCode = 409;
    error.code = 'DOMAIN_NOT_RENEWABLE';
    throw error;
  }

  const quote = await quoteRenewal(domainDoc);
  const reference = `nile_dom_renew_${domainDoc._id}_${Date.now()}`;
  const payment = await DomainPayment.create({
    merchant: merchant._id,
    domain: domainDoc._id,
    purpose: 'domain-renewal',
    reference,
    amountNGN: quote.priceNGN,
    currency: 'NGN',
    status: 'pending',
  });

  const appUrl = (process.env.CLIENT_URL || 'https://app.nilebooking.co').replace(/\/$/, '');
  const callbackUrl =
    process.env.DOMAIN_RENEWAL_CALLBACK_URL || `${appUrl}/dashboard/domains`;
  const initialized = await paystackService.initializePayment(
    quote.priceNGN,
    merchant.email,
    reference,
    {
      purpose: 'domain-renewal',
      domainId: String(domainDoc._id),
      merchantId: String(merchant._id),
      paymentId: String(payment._id),
      domain: domainDoc.domain,
    },
    { callbackUrl }
  );

  domainDoc.renewal = {
    ...plain(domainDoc.renewal),
    status: 'pending_payment',
    quotedAt: new Date(),
    quoteExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    priceNGN: quote.priceNGN,
    priceUSD: quote.registrarUSD,
    reference,
    lastError: null,
  };
  await domainDoc.save();

  return {
    reference,
    amountNGN: quote.priceNGN,
    authorizationUrl: initialized?.data?.authorization_url || null,
    accessCode: initialized?.data?.access_code || null,
    domain: serializeDomain(domainDoc),
  };
};

export const processRenewalPayment = async (data) => {
  const metadata = data?.metadata || {};
  if (metadata.purpose !== 'domain-renewal') return { ignored: true };

  const reference = data.reference;
  const amountKobo = Number(data.amount);
  const currency = String(data.currency || '').toUpperCase();

  if (!reference || data.status !== 'success') {
    return { ignored: true, reason: 'not_successful' };
  }

  const payment = await DomainPayment.findOne({ reference });
  if (!payment) return { ignored: true, reason: 'payment_not_found' };
  if (payment.status === 'renewed' || payment.status === 'renewing') {
    return { alreadyProcessed: true };
  }
  if (String(payment.domain) !== String(metadata.domainId)) {
    const error = new Error('Payment metadata does not match the stored domain.');
    error.statusCode = 400;
    throw error;
  }
  if (amountKobo !== Math.round(payment.amountNGN * 100)) {
    const error = new Error('Payment amount does not match the renewal quote.');
    error.statusCode = 400;
    throw error;
  }
  if (currency !== 'NGN') {
    const error = new Error('Renewal payment must be in NGN.');
    error.statusCode = 400;
    throw error;
  }

  const claimed = await DomainPayment.findOneAndUpdate(
    { _id: payment._id, status: 'pending' },
    {
      $set: {
        status: 'renewing',
        paidAt: new Date(),
        providerEventId: data.id ? String(data.id) : null,
      },
    },
    { new: true }
  );
  if (!claimed) return { alreadyProcessed: true };

  const domainDoc = await CustomDomain.findById(claimed.domain);
  if (!domainDoc) {
    claimed.status = 'failed';
    claimed.failureReason = 'Domain record not found';
    await claimed.save();
    return { ignored: true, reason: 'domain_not_found' };
  }

  const merchant = await User.findById(domainDoc.merchant);

  try {
    await renewDomain({ domain: domainDoc.domain, years: 1 });
    let expiryDate = domainDoc.registration?.expiryDate
      ? new Date(domainDoc.registration.expiryDate)
      : new Date();
    if (expiryDate < new Date()) expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    try {
      const info = await getDomainInfo(domainDoc.domain);
      if (info.expiryDate) expiryDate = info.expiryDate;
    } catch {
      // The registrar confirmed renewal; use the calculated date.
    }

    domainDoc.registration = {
      ...plain(domainDoc.registration),
      expiryDate,
      autoRenew: true,
    };
    domainDoc.renewal = {
      ...plain(domainDoc.renewal),
      status: 'renewed',
      paidAt: claimed.paidAt,
      lastError: null,
    };
    if (domainDoc.status === 'EXPIRED') {
      domainDoc.status = 'DNS_PENDING';
      domainDoc.active = false;
    }
    await domainDoc.save();

    claimed.status = 'renewed';
    claimed.renewedAt = new Date();
    await claimed.save();

    await notifyMerchant(
      merchant,
      `Your domain ${domainDoc.domain} has been renewed`,
      domainEmailShell(
        'Domain renewed',
        `<p><strong>${escapeHtml(domainDoc.domain)}</strong> is renewed until <strong>${expiryDate.toDateString()}</strong>.</p>
         <p>Your payment of ₦${Number(claimed.amountNGN).toLocaleString()} was received. Thank you.</p>`
      ),
      'Domain Renewal'
    );

    return { renewed: true, domain: serializeDomain(domainDoc) };
  } catch (error) {
    claimed.status = 'failed';
    claimed.failureReason = error.message;
    await claimed.save();

    domainDoc.renewal = {
      ...plain(domainDoc.renewal),
      status: 'failed',
      lastError: error.message,
    };
    await domainDoc.save();

    await notifyMerchant(
      merchant,
      `We could not renew ${domainDoc.domain}`,
      domainEmailShell(
        'Renewal needs attention',
        `<p>Your payment was received, but the registrar did not confirm the renewal.</p>
         <p>Our team has been alerted. Please contact support with reference <strong>${escapeHtml(reference)}</strong>.</p>`
      ),
      'Domain Renewal Failed'
    );

    throw error;
  }
};

export const verifyRenewalReturn = async ({ merchantId, reference }) => {
  const payment = await DomainPayment.findOne({ reference, merchant: merchantId });
  if (!payment) {
    const error = new Error('Renewal payment not found.');
    error.statusCode = 404;
    throw error;
  }

  const verification = await paystackService.verifyPayment(reference);
  if (verification?.data?.status !== 'success') {
    return { success: false, message: 'Payment is not successful yet.' };
  }

  await processRenewalPayment(verification.data);
  const domainDoc = await CustomDomain.findById(payment.domain);
  return { success: true, domain: serializeDomain(domainDoc) };
};

export const resolvePublicTenant = async (host) => {
  let hostname;
  try {
    ({ hostname } = normalizeHostname(host));
  } catch {
    return null;
  }

  const candidates = hostname.startsWith('www.')
    ? [hostname, hostname.replace(/^www\./, '')]
    : [hostname];

  const domainDoc = await CustomDomain.findOne({
    domain: { $in: candidates },
    status: 'ACTIVE',
    active: true,
  })
    .populate('merchant', 'slug businessName name logo profileImage')
    .lean();

  if (!domainDoc?.merchant) return null;
  return {
    slug: domainDoc.merchant.slug,
    businessName: domainDoc.merchant.businessName || domainDoc.merchant.name,
    logo: domainDoc.merchant.logo || domainDoc.merchant.profileImage || null,
    domain: domainDoc.domain,
  };
};

export const runDomainMaintenance = async () => {
  const now = new Date();
  const result = {
    hostingChecked: 0,
    expired: 0,
    remindersSent: 0,
    failed: 0,
  };

  const pendingHosting = isVercelConfigured()
    ? await CustomDomain.find({
        status: { $in: ['DNS_PENDING', 'CONNECTING'] },
        source: 'purchased',
      }).limit(20)
    : [];

  for (const domainDoc of pendingHosting) {
    try {
      await activateIfReady(domainDoc);
      result.hostingChecked += 1;
    } catch {
      result.failed += 1;
    }
  }

  const expired = await CustomDomain.find({
    status: { $in: ['ACTIVE', 'DNS_PENDING', 'REGISTERED'] },
    'registration.expiryDate': { $lt: now },
  }).limit(50);

  for (const domainDoc of expired) {
    domainDoc.status = 'EXPIRED';
    domainDoc.active = false;
    await domainDoc.save();
    await clearMerchantMirror(domainDoc);
    for (const target of hostingTargets(domainDoc.domain)) {
      await detachVercelDomain(target).catch(() => {});
    }
    result.expired += 1;
  }

  // A crash between "payment received" and "registrar renewed" leaves a payment
  // in `renewing`. Do not re-charge or silently retry a registrar renewal; flag
  // it for support while keeping the payment record.
  const stuckRenewals = await DomainPayment.find({
    status: 'renewing',
    updatedAt: { $lt: new Date(now.getTime() - 10 * 60 * 1000) },
  }).limit(20);

  for (const payment of stuckRenewals) {
    payment.status = 'failed';
    payment.failureReason = 'Renewal confirmation timed out; support review required.';
    await payment.save();
    const domainDoc = await CustomDomain.findById(payment.domain);
    if (domainDoc) {
      domainDoc.renewal = {
        ...plain(domainDoc.renewal),
        status: 'failed',
        lastError: payment.failureReason,
      };
      await domainDoc.save();
    }
    logEvent('domain_renewal_stuck', {
      reference: payment.reference,
      domainId: String(payment.domain),
    });
    result.failed += 1;
  }

  const reminderCutoff = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const reminderWindow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const renewals = await CustomDomain.find({
    status: { $in: ['ACTIVE', 'DNS_PENDING', 'REGISTERED'] },
    'registration.expiryDate': { $gt: reminderWindow, $lte: reminderCutoff },
    $or: [
      { 'renewal.lastReminderAt': null },
      { 'renewal.lastReminderAt': { $exists: false } },
      { 'renewal.lastReminderAt': { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    ],
  }).limit(50);

  for (const domainDoc of renewals) {
    const merchant = await User.findById(domainDoc.merchant);
    if (!merchant?.email) continue;
    const expiry = domainDoc.registration?.expiryDate;
    await notifyMerchant(
      merchant,
      `Renewal reminder for ${domainDoc.domain}`,
      domainEmailShell(
        'Your domain renews soon',
        `<p><strong>${escapeHtml(domainDoc.domain)}</strong> is registered until <strong>${expiry ? new Date(expiry).toDateString() : 'soon'}</strong>.</p>
         <p>Renew from your Nile Booking dashboard to keep the domain and storefront online. Renewal is paid by you; it is not included in the Premium plan.</p>`
      ),
      'Domain Renewal Reminder'
    );
    domainDoc.renewal = {
      ...plain(domainDoc.renewal),
      lastReminderAt: new Date(),
    };
    await domainDoc.save();
    result.remindersSent += 1;
  }

  return result;
};

export const serializeMerchantDomain = serializeDomain;
