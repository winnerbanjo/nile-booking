import express from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServicesBySlug,
} from '../controllers/serviceController.js';
import { protect, providerOnly } from '../middleware/auth.js';

const router = express.Router();

// Provider routes
router.get('/', protect, providerOnly, getServices);
router.get('/:id', protect, providerOnly, getService);
router.post('/', protect, providerOnly, createService);
router.put('/:id', protect, providerOnly, updateService);
router.delete('/:id', protect, providerOnly, deleteService);

// Public route
router.get('/provider/:slug', getServicesBySlug);

export default router;
