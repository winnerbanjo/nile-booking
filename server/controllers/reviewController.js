import Review from '../models/Review.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

export const submitReview = async (req, res) => {
  try {
    const { providerSlug, serviceId, customerName, customerEmail, rating, comment } = req.body;
    if (!providerSlug || !customerName || !customerEmail || !rating) {
      return res.status(400).json({ message: 'providerSlug, customerName, customerEmail, and rating are required' });
    }
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const provider = await User.findOne({ slug: providerSlug }).lean();
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReview = await Review.findOne({ provider: provider._id, customerEmail: customerEmail.toLowerCase().trim(), createdAt: { $gte: oneDayAgo } });
    if (recentReview) return res.status(429).json({ message: 'You have already submitted a review for this provider today.' });
    let resolvedServiceId = null;
    let serviceName = '';
    if (serviceId) {
      const svc = await Service.findOne({ _id: serviceId, provider: provider._id }).lean();
      if (svc) { resolvedServiceId = svc._id; serviceName = svc.name; }
    }
    const review = await Review.create({
      provider: provider._id,
      service: resolvedServiceId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      rating: Number(rating),
      comment: (comment || '').trim(),
      serviceName,
    });
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review', error: error.message });
  }
};

export const getReviewsBySlug = async (req, res) => {
  try {
    const provider = await User.findOne({ slug: req.params.slug }).lean();
    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    const reviews = await Review.find({ provider: provider._id, isPublished: true }).sort({ createdAt: -1 }).limit(50).lean();
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : null;
    res.json({ reviews, total: reviews.length, avgRating });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    const published = reviews.filter(r => r.isPublished);
    const totalRating = published.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = published.length > 0 ? parseFloat((totalRating / published.length).toFixed(1)) : null;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    published.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    res.json({ reviews, total: reviews.length, avgRating, breakdown });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const toggleReviewPublish = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, provider: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.isPublished = !review.isPublished;
    await review.save();
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, provider: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await Review.deleteOne({ _id: review._id });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
