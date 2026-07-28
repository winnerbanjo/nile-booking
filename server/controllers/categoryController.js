import slugify from 'slugify';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';

// @desc    Get all categories for merchant
// @route   GET /api/service-categories
// @access  Private (Merchant)
export const getCategories = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.find({
      merchantId: req.user._id,
      deletedAt: null,
    }).sort({ sortOrder: 1, createdAt: -1 });

    // Calculate service counts dynamically
    const categoryIds = categories.map((c) => c._id);
    const serviceCounts = await Service.aggregate([
      { $match: { provider: req.user._id, categoryId: { $in: categoryIds }, isActive: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);

    const countMap = serviceCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const categoriesWithCount = categories.map((cat) => {
      const catObj = cat.toObject();
      catObj.serviceCount = countMap[cat._id.toString()] || 0;
      return catObj;
    });

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/service-categories
// @access  Private (Merchant)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name || name.trim().length < 2 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Category name must be between 2 and 60 characters' });
    }

    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();
    
    const existing = await ServiceCategory.findOne({
      merchantId: req.user._id,
      normalizedName,
    });
    
    if (existing) {
      // If deleted, we could restore it, but let's just error for now to keep it simple, or restore it.
      if (existing.deletedAt) {
        existing.deletedAt = null;
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({ success: true, message: 'Restored deleted category', data: existing });
      }
      return res.status(409).json({ success: false, message: 'A category with this name already exists' });
    }

    // Slug generation
    let baseSlug = slugify(trimmedName, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await ServiceCategory.findOne({ merchantId: req.user._id, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const maxOrderCat = await ServiceCategory.findOne({ merchantId: req.user._id }).sort({ sortOrder: -1 });
    const sortOrder = maxOrderCat ? maxOrderCat.sortOrder + 1 : 0;

    const category = await ServiceCategory.create({
      merchantId: req.user._id,
      name: trimmedName,
      normalizedName,
      slug,
      description,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/service-categories/:id
// @access  Private (Merchant)
export const getCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findOne({
      _id: req.params.id,
      merchantId: req.user._id,
      deletedAt: null,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PATCH /api/service-categories/:id
// @access  Private (Merchant)
export const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findOne({
      _id: req.params.id,
      merchantId: req.user._id,
      deletedAt: null,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    let nameChanged = false;

    if (req.body.name) {
      const trimmedName = req.body.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 60) {
        return res.status(400).json({ success: false, message: 'Category name must be between 2 and 60 characters' });
      }
      const normalizedName = trimmedName.toLowerCase();
      
      if (normalizedName !== category.normalizedName) {
        const existing = await ServiceCategory.findOne({
          merchantId: req.user._id,
          normalizedName,
          _id: { $ne: category._id }
        });
        if (existing) {
          return res.status(409).json({ success: false, message: 'A category with this name already exists' });
        }
        category.name = trimmedName;
        category.normalizedName = normalizedName;
        
        // Generate new slug safely
        let baseSlug = slugify(trimmedName, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (await ServiceCategory.findOne({ merchantId: req.user._id, slug, _id: { $ne: category._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        category.slug = slug;
        nameChanged = true;
      }
    }

    ['description', 'image', 'icon', 'colour', 'isActive'].forEach(field => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await category.save();

    if (nameChanged) {
      // Update linked active services' snapshot
      await Service.updateMany(
        { categoryId: category._id, provider: req.user._id },
        { $set: { categoryNameSnapshot: category.name } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder categories
// @route   PATCH /api/service-categories/reorder
// @access  Private (Merchant)
export const reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Invalid payload format' });
    }

    // Verify all categories belong to merchant
    const categoryIds = categories.map(c => c.id);
    const existingCount = await ServiceCategory.countDocuments({
      _id: { $in: categoryIds },
      merchantId: req.user._id,
      deletedAt: null
    });

    if (existingCount !== categories.length) {
      return res.status(400).json({ success: false, message: 'One or more categories are invalid or do not belong to you' });
    }

    const bulkOps = categories.map((cat) => ({
      updateOne: {
        filter: { _id: cat.id, merchantId: req.user._id },
        update: { $set: { sortOrder: cat.sortOrder } }
      }
    }));

    await ServiceCategory.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: 'Categories reordered successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/service-categories/:id
// @access  Private (Merchant)
export const deleteCategory = async (req, res, next) => {
  try {
    const { action, targetCategoryId } = req.body; // action: 'delete' | 'move' | 'uncategorize'

    const category = await ServiceCategory.findOne({
      _id: req.params.id,
      merchantId: req.user._id,
      deletedAt: null,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const linkedServicesCount = await Service.countDocuments({
      categoryId: category._id,
      provider: req.user._id
    });

    if (linkedServicesCount > 0) {
      if (!action) {
        return res.status(400).json({ success: false, message: 'Action required because category contains services' });
      }

      if (action === 'move') {
        if (!targetCategoryId) {
          return res.status(400).json({ success: false, message: 'Target category ID required' });
        }
        const targetCat = await ServiceCategory.findOne({
          _id: targetCategoryId,
          merchantId: req.user._id,
          deletedAt: null
        });
        if (!targetCat) {
          return res.status(404).json({ success: false, message: 'Target category not found' });
        }
        await Service.updateMany(
          { categoryId: category._id, provider: req.user._id },
          { $set: { categoryId: targetCat._id, categoryNameSnapshot: targetCat.name } }
        );
      } else if (action === 'uncategorize') {
        await Service.updateMany(
          { categoryId: category._id, provider: req.user._id },
          { $set: { categoryId: null, categoryNameSnapshot: '' } }
        );
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }
    }

    category.deletedAt = new Date();
    category.isActive = false;
    await category.save();

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
