/**
 * Cron endpoints fail closed when CRON_SECRET is absent.
 * Supports the Vercel Cron Bearer header and an explicit x-cron-secret header.
 */
export const requireCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({
      message: 'Cron is not configured. Set CRON_SECRET.',
      code: 'CRON_NOT_CONFIGURED',
    });
  }

  const bearer = String(req.headers.authorization || '').startsWith('Bearer ')
    ? String(req.headers.authorization).slice(7)
    : null;
  const supplied = req.headers['x-cron-secret'] || bearer;

  if (supplied !== secret) {
    return res.status(401).json({ message: 'Unauthorized', code: 'CRON_UNAUTHORIZED' });
  }

  return next();
};
