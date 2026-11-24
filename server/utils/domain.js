import crypto from 'node:crypto';
import net from 'node:net';
import { domainToASCII } from 'node:url';
import { parse as parseDomain } from 'tldts';

export const PLATFORM_DOMAINS = new Set([
  'nilebooking.co',
  'www.nilebooking.co',
  'app.nilebooking.co',
  'api.nilebooking.co',
  'nilebooking.com',
  'www.nilebooking.com',
]);

const BLOCKED_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.test',
  '.invalid',
  '.example',
  '.onion',
  '.vercel.app',
];

export class DomainValidationError extends Error {
  constructor(message, code = 'INVALID_DOMAIN') {
    super(message);
    this.name = 'DomainValidationError';
    this.statusCode = 400;
    this.code = code;
  }
}

/**
 * Normalises user input into a lower-case ASCII hostname.
 * Accepts a pasted URL, strips protocol/path/port, and converts IDN to punycode.
 */
export const normalizeHostname = (input) => {
  let value = String(input || '').trim().toLowerCase();
  if (!value) throw new DomainValidationError('Enter a domain name.');

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split('/')[0].split('?')[0].split('#')[0];
  value = value.replace(/:\d+$/, '');
  value = value.replace(/\.+$/, '');

  if (!value || value.length > 253) {
    throw new DomainValidationError('That domain name is not valid.');
  }
  if (net.isIP(value)) {
    throw new DomainValidationError('Enter a domain name, not an IP address.');
  }
  if (value.includes(' ') || value.includes('_')) {
    throw new DomainValidationError('Domain names cannot contain spaces or underscores.');
  }

  const ascii = domainToASCII(value);
  if (!ascii || ascii.length > 253) {
    throw new DomainValidationError('That domain name is not valid.');
  }

  const parsed = parseDomain(ascii, { allowPrivateDomains: true });
  if (!parsed.publicSuffix || !parsed.domainWithoutSuffix) {
    throw new DomainValidationError('Use a complete domain, for example yourbusiness.com.');
  }

  const labels = ascii.split('.');
  if (labels.some((label) => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'))) {
    throw new DomainValidationError('That domain name is not valid.');
  }
  if (!/^[a-z0-9.-]+$/.test(ascii)) {
    throw new DomainValidationError('That domain name is not valid.');
  }

  const finalLabel = labels[labels.length - 1];
  if (!/^[a-z0-9-]{2,11}$/.test(finalLabel)) {
    throw new DomainValidationError('That domain extension is not supported.');
  }

  if (PLATFORM_DOMAINS.has(ascii) || BLOCKED_SUFFIXES.some((suffix) => ascii.endsWith(suffix))) {
    throw new DomainValidationError('That domain cannot be used with Nile Booking.', 'DOMAIN_RESERVED');
  }

  return {
    hostname: ascii,
    unicode: value,
    registrable: parsed.domain === ascii,
    publicSuffix: parsed.publicSuffix,
    sld: parsed.domainWithoutSuffix,
  };
};

export const isRegistrableDomain = (input) => normalizeHostname(input).registrable;

export const normalizeOrigin = (origin) => {
  try {
    const url = new URL(String(origin || ''));
    if (!/^https?:$/.test(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
};

const encryptionKey = () => {
  const secret =
    process.env.DOMAIN_CONTACT_ENCRYPTION_KEY ||
    (process.env.NODE_ENV === 'production' ? '' : process.env.JWT_SECRET) ||
    '';
  if (!secret) {
    throw new DomainValidationError(
      'Domain contact encryption is not configured. Set DOMAIN_CONTACT_ENCRYPTION_KEY.',
      'DOMAIN_ENCRYPTION_NOT_CONFIGURED'
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptJson = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

export const decryptJson = (payload) => {
  if (!payload) return null;
  const [version, ivB64, tagB64, dataB64] = String(payload).split('.');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) return null;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(ivB64, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
};

export const maskEmail = (email) =>
  String(email || '').replace(/^(.)(.*)(.@.*)$/, (_, first, middle, domain) => first + '*'.repeat(Math.min(middle.length, 6)) + domain);

export const formatNamecheapPhone = (phone, country = 'NG') => {
  const raw = String(phone || '').replace(/[^\d+.]/g, '');
  if (/^\+\d{1,4}\.\d+$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (country === 'NG' || digits.startsWith('234')) {
    const local = digits.startsWith('234') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
    return `+234.${local}`;
  }
  return `+${digits}`;
};
