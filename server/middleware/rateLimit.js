
/**
 * Small in-process rate limiter.
 *
 * Vercel functions are multi-instance, so this is a per-instance guard, not a
 * distributed quota. It still closes the accidental open door and is paired
 * with a database-backed login backoff for the admin master key.
 */
const buckets = new Map();

const nowMs = () => Date.now();

const cleanup = (now) => {
  if (buckets.size < 1000) return;
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now && (!value.blockedUntil || value.blockedUntil <= now)) {
      buckets.delete(key);
    }
  }
};

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();

export const getClientIp = clientIp;

export const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 30,
  keyGenerator,
  message = 'Too many requests. Please wait and try again.',
  code = 'RATE_LIMITED',
}) => (req, res, next) => {
  const now = nowMs();
  cleanup(now);

  const key = keyGenerator ? keyGenerator(req) : clientIp(req);
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    res.set('Retry-After', String(Math.ceil((bucket.blockedUntil - now) / 1000)));
    return res.status(429).json({ message, code, retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000) });
  }

  bucket.count += 1;
  if (bucket.count > max) {
    bucket.blockedUntil = bucket.resetAt;
    res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message, code });
  }

  next();
};

/**
 * Admin login uses exponential backoff on failed keys, keyed by client IP. A
 * successful login clears that IP's bucket.
 */
const adminBuckets = new Map();

// Backoff is per IP, not per submitted password; varying guesses must not
// create fresh buckets.
const adminKey = (req) => `admin:${clientIp(req)}`;

export const adminLoginGuard = (req, res, next) => {
  const now = nowMs();
  const key = adminKey(req);
  const bucket = adminBuckets.get(key);

  if (bucket?.blockedUntil && bucket.blockedUntil > now) {
    const retryAfter = Math.ceil((bucket.blockedUntil - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      message: 'Too many failed admin login attempts. Try again later.',
      code: 'ADMIN_LOGIN_BACKOFF',
      retryAfter,
    });
  }

  req.adminLoginKey = key;
  next();
};

export const recordAdminLoginFailure = (key) => {
  const now = nowMs();
  const bucket = adminBuckets.get(key) || { failures: 0, blockedUntil: 0 };
  bucket.failures += 1;

  // 5 failures = 30s, then 1m, 2m, 4m ... capped at 15 minutes.
  if (bucket.failures >= 5) {
    const delayMs = Math.min(15 * 60 * 1000, 30_000 * 2 ** (bucket.failures - 5));
    bucket.blockedUntil = now + delayMs;
  }

  adminBuckets.set(key, bucket);
  return bucket;
};

export const clearAdminLoginFailures = (key) => {
  adminBuckets.delete(key);
};

export const resetRateLimitsForTests = () => {
  buckets.clear();
  adminBuckets.clear();
};

export const providerKey = (req) =>
  String(
    req.body?.providerSlug ||
      req.body?.provider ||
      req.params?.token ||
      'unknown-provider'
  ).slice(0, 120);
