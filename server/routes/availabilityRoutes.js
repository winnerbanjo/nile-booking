import express from 'express';
import { getProviderAvailability, sweepHolds } from '../controllers/availabilityController.js';
import { requireCronSecret } from '../middleware/cronAuth.js';

const router = express.Router();

router.get('/', getProviderAvailability);
router.get('/sweep', requireCronSecret, sweepHolds);
router.post('/sweep', requireCronSecret, sweepHolds);

export default router;
