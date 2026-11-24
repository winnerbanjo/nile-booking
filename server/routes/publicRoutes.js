import express from 'express';
import { getPublicTenant } from '../controllers/domainController.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const tenantLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => `public:tenant:${req.ip}`,
  message: 'Too many requests.',
});

router.get('/tenant', tenantLimit, getPublicTenant);

export default router;
