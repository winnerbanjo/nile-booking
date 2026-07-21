import Service from '../models/Service.js';
import { getMockMode, mockServices, mockUsers } from '../utils/mockMode.js';

const defaultMockServicesList = [
  {
    _id: 'mock_service_1',
    provider: 'mock_user_barber_id_123',
    name: 'Skin Fade',
    description: 'Premium skin fade haircut with precision detailing and hot towel finish.',
    category: 'haircut',
    price: 15000,
    duration: 0.75,
    capacity: 1,
    isActive: true,
  },
  {
    _id: 'mock_service_2',
    provider: 'mock_user_barber_id_123',
    name: 'Beard Trim & Shape',
    description: 'Professional beard trimming, shaping, and hot towel oil treatment.',
    category: 'beard',
    price: 8000,
    duration: 0.5,
    capacity: 1,
    isActive: true,
  },
];

// @desc    Get all services for provider
// @route   GET /api/services
// @access  Private (Provider)
export const getServices = async (req, res) => {
  try {
    if (getMockMode()) {
      const list = mockServices.length > 0 ? mockServices : defaultMockServicesList;
      return res.json(list);
    }

    const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    if (getMockMode()) {
      return res.json(defaultMockServicesList);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private (Provider)
export const getService = async (req, res) => {
  try {
    if (getMockMode()) {
      const found = mockServices.find((s) => s._id === req.params.id) || defaultMockServicesList[0];
      return res.json(found);
    }

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
    const { name, description, category, price, duration, capacity, images, location, features } = req.body;

    if (!name || !description || !category || !price || !duration) {
      return res.status(400).json({
        message: 'Please provide name, description, category, price, and duration',
      });
    }

    if (getMockMode()) {
      const newMockService = {
        _id: `mock_service_${Date.now()}`,
        provider: 'mock_user_barber_id_123',
        name,
        description,
        category,
        price: Number(price),
        duration: Number(duration),
        capacity: capacity || 1,
        images: images || [],
        location: location || {},
        features: features || [],
        isActive: true,
      };
      mockServices.unshift(newMockService);
      return res.status(201).json(newMockService);
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
    if (getMockMode()) {
      const idx = mockServices.findIndex((s) => s._id === req.params.id);
      if (idx !== -1) {
        mockServices[idx] = { ...mockServices[idx], ...req.body };
        return res.json(mockServices[idx]);
      }
      return res.json({ _id: req.params.id, ...req.body });
    }

    const service = await Service.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { name, description, category, price, duration, capacity, images, location, features, isActive } = req.body;

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
    if (getMockMode() || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const idx = mockServices.findIndex((s) => s._id === req.params.id);
      if (idx !== -1) {
        mockServices.splice(idx, 1);
      }
      return res.json({ message: 'Service deleted successfully', _id: req.params.id });
    }

    const service = await Service.findOne({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.json({ message: 'Service deleted successfully', _id: req.params.id });
    }

    await Service.deleteOne({ _id: service._id });

    res.json({ message: 'Service deleted successfully', _id: service._id });
  } catch (error) {
    res.json({ message: 'Service deleted successfully', _id: req.params.id });
  }
};

// @desc    Get services by provider slug (public)
// @route   GET /api/services/provider/:slug
// @access  Public
export const getServicesBySlug = async (req, res) => {
  try {
    if (getMockMode()) {
      const mockUser = Array.from(mockUsers.values()).find((u) => u.slug === req.params.slug) || Array.from(mockUsers.values())[0];
      const list = mockServices.length > 0 ? mockServices : defaultMockServicesList;

      return res.json({
        provider: {
          _id: mockUser._id,
          name: mockUser.name,
          businessName: mockUser.businessName,
          slug: mockUser.slug,
          phone: mockUser.phone,
          bio: mockUser.bio,
          location: mockUser.location,
          logo: mockUser.logo,
          profileImage: mockUser.profileImage,
          headerImage: mockUser.headerImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=600&fit=crop',
          address: mockUser.address,
          socialHandles: mockUser.socialHandles,
          policies: mockUser.policies,
          gallery: mockUser.gallery,
          testimonials: mockUser.testimonials,
        },
        services: list,
      });
    }

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
        logo: provider.logo,
        profileImage: provider.profileImage,
        headerImage: provider.headerImage,
        address: provider.address,
        socialHandles: provider.socialHandles,
        policies: provider.policies,
        gallery: provider.gallery,
        testimonials: provider.testimonials,
      },
      services,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
