import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { formatNamecheapPhone } from '../../utils/domain.js';

export class DomainProviderError extends Error {
  constructor(message, { code = 'DOMAIN_PROVIDER_ERROR', statusCode = 502, retryable = false, details = null } = {}) {
    super(message);
    this.name = 'DomainProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
});

const asArray = (value) => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const textOf = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value['#text'] ?? '');
};

const credentials = () => {
  const environment = process.env.NAMECHEAP_ENV === 'sandbox' ? 'sandbox' : 'production';
  const isSandbox = environment === 'sandbox';
  const apiUser = isSandbox
    ? process.env.NAMECHEAP_SANDBOX_API_USER
    : process.env.NAMECHEAP_API_USER;
  const apiKey = isSandbox
    ? process.env.NAMECHEAP_SANDBOX_API_KEY
    : process.env.NAMECHEAP_API_KEY;
  const clientIp = isSandbox
    ? process.env.NAMECHEAP_SANDBOX_CLIENT_IP || process.env.NAMECHEAP_CLIENT_IP
    : process.env.NAMECHEAP_CLIENT_IP;

  if (!apiUser || !apiKey || !clientIp) {
    throw new DomainProviderError(
      isSandbox
        ? 'Namecheap sandbox credentials are not configured.'
        : 'Domain registration is temporarily unavailable. Registrar credentials are not configured.',
      { code: 'DOMAIN_PROVIDER_NOT_CONFIGURED', statusCode: 503 }
    );
  }

  return {
    environment,
    endpoint: isSandbox
      ? 'https://api.sandbox.namecheap.com/xml.response'
      : 'https://api.namecheap.com/xml.response',
    params: {
      ApiUser: apiUser,
      ApiKey: apiKey,
      UserName: apiUser,
      ClientIp: clientIp,
    },
  };
};

const parseResponse = (data) => {
  let parsed;
  try {
    parsed = parser.parse(data);
  } catch {
    throw new DomainProviderError('The domain provider returned an unreadable response.', {
      code: 'DOMAIN_PROVIDER_BAD_RESPONSE',
      retryable: true,
    });
  }

  const response = parsed?.ApiResponse;
  if (!response) {
    throw new DomainProviderError('The domain provider returned an unexpected response.', {
      code: 'DOMAIN_PROVIDER_BAD_RESPONSE',
      retryable: true,
    });
  }

  const errors = asArray(response.Errors?.Error)
    .map((error) => ({
      number: String(error?.['@_Number'] || ''),
      message: textOf(error),
    }))
    .filter((error) => error.message || error.number);

  if (String(response['@_Status'] || '').toUpperCase() !== 'OK' || errors.length > 0) {
    const message = errors.map((error) => error.message).filter(Boolean).join(' ') ||
      'The domain provider rejected the request.';
    throw new DomainProviderError(message, {
      code: 'DOMAIN_PROVIDER_REJECTED',
      statusCode: 502,
      retryable: false,
      details: { errors },
    });
  }

  return response;
};

const call = async (command, params = {}, method = 'GET') => {
  const config = credentials();
  const payload = {
    ...config.params,
    Command: command,
    ...params,
  };

  try {
    const response = method === 'POST'
      ? await axios.post(config.endpoint, new URLSearchParams(payload).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        })
      : await axios.get(config.endpoint, { params: payload, timeout: 15000 });

    return parseResponse(response.data);
  } catch (error) {
    if (error instanceof DomainProviderError) throw error;
    const status = error.response?.status;
    throw new DomainProviderError(
      status
        ? `The domain provider could not be reached (HTTP ${status}).`
        : 'The domain provider could not be reached. Please try again.',
      {
        code: 'DOMAIN_PROVIDER_UNAVAILABLE',
        statusCode: 502,
        retryable: true,
      }
    );
  }
};

const commandResponse = (response) => response?.CommandResponse || {};

export const checkDomains = async (domains) => {
  const list = asArray(domains).filter(Boolean);
  if (list.length === 0) return [];

  const response = await call('namecheap.domains.check', {
    DomainList: list.join(','),
  });
  const results = asArray(commandResponse(response).DomainCheckResult);

  return results.map((result) => ({
    domain: String(result?.['@_Domain'] || '').toLowerCase(),
    available: String(result?.['@_Available'] || '').toLowerCase() === 'true',
    isPremium: String(result?.['@_IsPremiumName'] || '').toLowerCase() === 'true',
    premiumRegistrationPrice: Number(result?.['@_PremiumRegistrationPrice']) || null,
    description: String(result?.['@_Description'] || result?.['@_ICANNReason'] || ''),
  }));
};

const FALLBACK_USD_PRICES = {
  com: 13.98,
  store: 12.98,
  shop: 12.98,
  net: 14.98,
  org: 14.98,
  biz: 16.98,
  co: 27.98,
  ng: 30,
  'com.ng': 25,
  io: 39.98,
  app: 19.98,
  dev: 19.98,
};

export const getTldPriceUSD = async (publicSuffix, action = 'REGISTER') => {
  const tld = String(publicSuffix || '').toLowerCase();
  if (!tld) return null;

  try {
    const response = await call('namecheap.users.getPricing', {
      ProductType: 'DOMAIN',
      ProductCategory: action === 'RENEW' ? 'RENEW' : 'REGISTER',
      ActionName: action,
      ProductName: tld,
    });

    const pricingRoot = commandResponse(response).UserGetPricingResult || commandResponse(response);
    const productTypes = asArray(pricingRoot.ProductType);
    for (const productType of productTypes) {
      const categories = asArray(productType.ProductCategory);
      for (const category of categories) {
        const products = asArray(category.Product);
        for (const product of products) {
          const name = String(product?.['@_Name'] || '').toLowerCase();
          if (name && name !== tld) continue;
          const prices = asArray(product.Price);
          const yearly = prices.find(
            (price) =>
              String(price?.['@_Duration'] || '1') === '1' &&
              String(price?.['@_DurationType'] || 'YEAR').toUpperCase() === 'YEAR'
          ) || prices[0];
          const amount = Number(
            yearly?.['@_YourPrice'] || yearly?.['@_Price'] || yearly?.['@_RegularPrice']
          );
          if (Number.isFinite(amount) && amount > 0) return amount;
        }
      }
    }
  } catch {
    // Pricing lookup failures fall through to the static table. Availability
    // itself must never fall back to "available".
  }

  return FALLBACK_USD_PRICES[tld] || FALLBACK_USD_PRICES[tld.split('.').pop()] || 19.98;
};

const contactParams = (prefix, contact) => {
  const phone = formatNamecheapPhone(contact.phone, contact.country);
  return {
    [`${prefix}FirstName`]: contact.firstName,
    [`${prefix}LastName`]: contact.lastName,
    [`${prefix}Address1`]: contact.address,
    [`${prefix}City`]: contact.city,
    [`${prefix}StateProvince`]: contact.state,
    [`${prefix}PostalCode`]: contact.postalCode,
    [`${prefix}Country`]: contact.country,
    [`${prefix}Phone`]: phone,
    [`${prefix}EmailAddress`]: contact.email,
    ...(contact.company ? { [`${prefix}OrganizationName`]: contact.company } : {}),
  };
};

export const createDomain = async ({ domain, years = 1, contact }) => {
  const response = await call(
    'namecheap.domains.create',
    {
      DomainName: domain,
      Years: String(years),
      ...contactParams('Registrant', contact),
      ...contactParams('Tech', contact),
      ...contactParams('Admin', contact),
      ...contactParams('AuxBilling', contact),
      AddFreeWhoisguard: 'yes',
      WGEnabled: 'yes',
    },
    'POST'
  );

  const result = commandResponse(response).DomainCreateResult || {};
  const registered =
    String(result['@_Registered'] || '').toLowerCase() === 'true' ||
    String(result['@_Status'] || '').toLowerCase() === 'ok';

  if (!registered) {
    throw new DomainProviderError('The registrar did not confirm the registration.', {
      code: 'DOMAIN_REGISTRATION_NOT_CONFIRMED',
      statusCode: 502,
      retryable: false,
    });
  }

  return {
    orderId: String(result['@_OrderID'] || result['@_TransactionID'] || ''),
    chargedAmountUSD: Number(result['@_ChargedAmount']) || null,
    whoisGuard: String(result['@_WhoisGuard'] || ''),
  };
};

export const setHosts = async ({ domain, records }) => {
  const params = { Domain: domain };
  records.forEach((record, index) => {
    const number = index + 1;
    params[`HostName${number}`] = record.host;
    params[`RecordType${number}`] = record.type;
    params[`Address${number}`] = record.value;
    params[`TTL${number}`] = String(record.ttl || 3600);
  });

  const response = await call('namecheap.domains.dns.setHosts', params, 'POST');
  const result = commandResponse(response).DomainSetHostsResult || {};
  const success =
    String(result['@_IsSuccess'] || '').toLowerCase() === 'true' ||
    String(result['@_Status'] || '').toLowerCase() === 'ok';

  if (!success) {
    throw new DomainProviderError('DNS records could not be applied at the registrar.', {
      code: 'DOMAIN_DNS_FAILED',
      statusCode: 502,
      retryable: true,
    });
  }

  return true;
};

export const renewDomain = async ({ domain, years = 1 }) => {
  const response = await call(
    'namecheap.domains.renew',
    { DomainName: domain, Years: String(years) },
    'POST'
  );
  const result = commandResponse(response).DomainRenewResult || {};
  const renewed =
    String(result['@_Renew'] || '').toLowerCase() === 'true' ||
    String(result['@_Status'] || '').toLowerCase() === 'ok';

  if (!renewed) {
    throw new DomainProviderError('The registrar did not confirm the renewal.', {
      code: 'DOMAIN_RENEWAL_NOT_CONFIRMED',
      statusCode: 502,
      retryable: false,
    });
  }

  return {
    chargedAmountUSD: Number(result['@_ChargedAmount']) || null,
    orderId: String(result['@_OrderID'] || result['@_TransactionID'] || ''),
  };
};

export const getDomainInfo = async (domain) => {
  const response = await call('namecheap.domains.getInfo', { DomainName: domain });
  const result = commandResponse(response).DomainGetInfoResult || {};
  const details = result.DomainDetails || {};
  const expiry = details.ExpiredDate ? new Date(details.ExpiredDate) : null;

  return {
    domain: String(result['@_DomainName'] || domain),
    expiryDate: expiry && !Number.isNaN(expiry.getTime()) ? expiry : null,
    createdDate: details.CreatedDate ? new Date(details.CreatedDate) : null,
    isPremium: String(result['@_IsPremium'] || '').toLowerCase() === 'true',
  };
};

export const namecheapEnvironment = () =>
  process.env.NAMECHEAP_ENV === 'sandbox' ? 'sandbox' : 'production';

export const assertNamecheapConfigured = () => {
  credentials();
  return true;
};
