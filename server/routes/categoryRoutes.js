import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} from '../controllers/categoryController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/reorder')
  .patch(reorderCategories);

router.route('/:id')
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

export default router;
