import Service from '../models/Service.js';

// @desc    Get all services for provider
// @route   GET /api/services
// @access  Private (Provider)
export const getServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private (Provider)
export const getService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private (Provider)
export const createService = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      duration,
      capacity,
      images,
      location,
      features,
    } = req.body;

    // Validation
    if (!name || !description || !category || !price || !duration) {
      return res.status(400).json({
        message: 'Please provide name, description, category, price, and duration',
      });
    }

    const service = await Service.create({
      provider: req.user._id,
      name,
      description,
      category,
      price,
      duration,
      capacity: capacity || 1,
      images: images || [],
      location: location || {},
      features: features || [],
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Provider)
export const updateService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const {
      name,
      description,
      category,
      price,
      duration,
      capacity,
      images,
      location,
      features,
      isActive,
    } = req.body;

    if (name) service.name = name;
    if (description) service.description = description;
    if (category) service.category = category;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (capacity !== undefined) service.capacity = capacity;
    if (images) service.images = images;
    if (location) service.location = location;
    if (features) service.features = features;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Provider)
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await Service.deleteOne({ _id: service._id });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get services by provider slug (public)
// @route   GET /api/services/provider/:slug
// @access  Public
export const getServicesBySlug = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const provider = await User.findOne({ slug: req.params.slug });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const services = await Service.find({
      provider: provider._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      provider: {
        _id: provider._id,
        name: provider.name,
        businessName: provider.businessName,
        slug: provider.slug,
        phone: provider.phone,
        bio: provider.bio,
        location: provider.location,
        profileImage: provider.profileImage,
        address: provider.address,
        socialHandles: provider.socialHandles,
        gallery: provider.gallery,
        testimonials: provider.testimonials,
      },
      services,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
