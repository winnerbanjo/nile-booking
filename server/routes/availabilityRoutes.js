import express from 'express';
import { getProviderAvailability, sweepHolds } from '../controllers/availabilityController.js';

const router = express.Router();

router.get('/', getProviderAvailability);
router.post('/sweep', sweepHolds);

export default router;
