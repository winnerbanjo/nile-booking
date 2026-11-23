/**
 * Security-critical secrets.
 *
 * There are deliberately no fallback values. Missing or short secrets must fail
 * closed instead of silently using a public string that would let anyone mint
 * tokens or log into the admin portal.
 */

const JWT_SECRET_MIN_LENGTH = 32;
const ADMIN_MASTER_KEY_MIN_LENGTH = 24;

const readSecret = (name, minLength) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required and has no fallback.`);
  }
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters.`);
  }
  return value;
};

export const getJwtSecret = () => readSecret('JWT_SECRET', JWT_SECRET_MIN_LENGTH);

export const getAdminMasterKey = () =>
  readSecret('ADMIN_MASTER_KEY', ADMIN_MASTER_KEY_MIN_LENGTH);

export const validateRequiredSecrets = () => {
  const missing = [];

  for (const [name, minLength] of [
    ['JWT_SECRET', JWT_SECRET_MIN_LENGTH],
    ['ADMIN_MASTER_KEY', ADMIN_MASTER_KEY_MIN_LENGTH],
  ]) {
    try {
      readSecret(name, minLength);
    } catch (error) {
      missing.push(error.message);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Refusing to start: ${missing.join(' ')} Rotate any previously deployed fallback values.`
    );
  }
};
