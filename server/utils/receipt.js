export class ReceiptValidationError extends Error {
  constructor(message, code = 'INVALID_RECEIPT') {
    super(message);
    this.name = 'ReceiptValidationError';
    this.code = code;
    this.status = 422;
  }
}

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const maxReceiptBytes = () => {
  const configured = Number(process.env.RECEIPT_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_BYTES;
};

/**
 * Receipts are sent as data URLs because the current client has no direct
 * upload flow. Validate the declared type and the decoded byte length before
 * anything reaches Cloudinary.
 */
export const validateReceiptDataUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('data:')) {
    throw new ReceiptValidationError('Receipt must be a base64 data URL.');
  }

  const match = /^data:([a-z0-9/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!match) {
    throw new ReceiptValidationError('Receipt is not valid base64 data.');
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ReceiptValidationError('Receipt must be a JPG, PNG, WebP, or PDF file.');
  }

  const base64 = match[2].replace(/\s/g, '');
  if (!base64 || base64.length % 4 !== 0) {
    throw new ReceiptValidationError('Receipt is not valid base64 data.');
  }

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) {
    throw new ReceiptValidationError('Receipt file is empty.');
  }
  if (bytes.length > maxReceiptBytes()) {
    throw new ReceiptValidationError(
      `Receipt exceeds the ${Math.round(maxReceiptBytes() / (1024 * 1024))} MB limit.`,
      'RECEIPT_TOO_LARGE'
    );
  }

  return { mimeType, bytes: bytes.length, dataUrl: value };
};
