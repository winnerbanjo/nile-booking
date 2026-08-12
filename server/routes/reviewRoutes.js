import express from 'express';
import { submitReview, getReviewsBySlug, getMyReviews, toggleReviewPublish, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', submitReview);
router.get('/provider/:slug', getReviewsBySlug);
router.get('/mine', protect, getMyReviews);
router.patch('/:id/toggle', protect, toggleReviewPublish);
router.delete('/:id', protect, deleteReview);

export default router;
