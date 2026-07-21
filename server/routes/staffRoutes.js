import express from 'express';
import { getStaff, createStaff, deleteStaff } from '../controllers/staffController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getStaff)
  .post(protect, createStaff);

router.route('/:id')
  .delete(protect, deleteStaff);

export default router;
