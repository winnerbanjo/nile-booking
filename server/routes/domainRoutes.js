import express from 'express';
import { protect, providerOnly } from '../middleware/auth.js';
import { requirePremium } from '../middleware/entitlement.js';
import { requireCronSecret } from '../middleware/cronAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  claimIncludedDomain,
  connectExistingDomain,
  getAvailability,
  getDomainOverview,
  getMyDomain,
  getSuggestions,
  refreshDomainStatus,
  removeDomain,
  renewDomainNow,
  retryDomainSetup,
  runDomainCron,
  verifyDomainOwnership,
  verifyRenewalPayment,
} from '../controllers/domainController.js';

const router = express.Router();

const searchLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `domains:search:${req.user?._id || req.ip}`,
  message: 'Too many domain searches. Please wait a minute and try again.',
});

const claimLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  keyGenerator: (req) => `domains:claim:${req.user?._id || req.ip}`,
  message: 'Too many domain attempts. Please contact support if you need help.',
});

const renewLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `domains:renew:${req.user?._id || req.ip}`,
  message: 'Too many renewal attempts. Please wait a few minutes.',
});

router.post('/cron/maintenance', requireCronSecret, runDomainCron);

// Emergency kill switch. Registration and renewal remain off until explicitly
// re-enabled, while the cron endpoint above can still reconcile existing rows.
router.use((req, res, next) => {
  if (process.env.DOMAINS_ENABLED === 'false') {
    return res.status(503).json({
      message: 'Custom domain management is temporarily unavailable.',
      code: 'DOMAINS_DISABLED',
    });
  }
  next();
});

router.use(protect, providerOnly);

router.get('/', getDomainOverview);
router.post('/suggestions', searchLimit, getSuggestions);
router.post('/availability', searchLimit, getAvailability);

router.post('/claim', requirePremium, claimLimit, claimIncludedDomain);
router.post('/connect', requirePremium, claimLimit, connectExistingDomain);

router.post('/renewals/verify', verifyRenewalPayment);
router.post('/:id/renew', renewLimit, renewDomainNow);
router.post('/:id/verify', verifyDomainOwnership);
router.post('/:id/refresh', refreshDomainStatus);
router.post('/:id/retry', retryDomainSetup);
router.get('/:id', getMyDomain);
router.delete('/:id', removeDomain);

export default router;
