import { AvailabilityError, getAvailability, sweepExpiredHolds } from '../services/availabilityService.js';

// @desc    Get server-computed availability for a provider/service
// @route   GET /api/availability?provider=<slug|id>&service=<serviceId>&date=YYYY-MM-DD
// @access  Public
export const getProviderAvailability = async (req, res) => {
  try {
    const { provider, slug, service, date } = req.query;

    if (!provider && !slug) {
      return res.status(400).json({
        message: 'A provider (slug or id) is required.',
        code: 'PROVIDER_REQUIRED',
      });
    }
    if (!service) {
      return res.status(400).json({
        message: 'A service id is required.',
        code: 'SERVICE_REQUIRED',
      });
    }

    const availability = await getAvailability({
      provider: typeof provider === 'string' ? provider : undefined,
      slug: typeof slug === 'string' ? slug : undefined,
      serviceId: service,
      date: typeof date === 'string' ? date : undefined,
    });

    res.json(availability);
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return res.status(error.status).json({
        message: error.message,
        code: error.code,
        ...error.details,
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Release elapsed holds across all providers
// @route   POST /api/availability/sweep
// @route   GET  /api/availability/sweep (Vercel Cron)
// @access  Cron only (requireCronSecret accepts Bearer or x-cron-secret)
export const sweepHolds = async (req, res) => {
  try {
    const result = await sweepExpiredHolds();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
