import express from 'express';
import { checkDomainAvailability, purchaseDomain } from '../controllers/domainController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/check', checkDomainAvailability);
router.post('/purchase', purchaseDomain);

export default router;
