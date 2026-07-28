import slugify from 'slugify';
import ServiceCategory from '../models/ServiceCategory.js';
import Service from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
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
      return next(new ApiError('Category name must be between 2 and 60 characters', 400));
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
      return next(new ApiError('A category with this name already exists', 409));
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
      return next(new ApiError('Category not found', 404));
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
      return next(new ApiError('Category not found', 404));
    }

    let nameChanged = false;

    if (req.body.name) {
      const trimmedName = req.body.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 60) {
        return next(new ApiError('Category name must be between 2 and 60 characters', 400));
      }
      const normalizedName = trimmedName.toLowerCase();
      
      if (normalizedName !== category.normalizedName) {
        const existing = await ServiceCategory.findOne({
          merchantId: req.user._id,
          normalizedName,
          _id: { $ne: category._id }
        });
        if (existing) {
          return next(new ApiError('A category with this name already exists', 409));
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
      return next(new ApiError('Invalid payload format', 400));
    }

    // Verify all categories belong to merchant
    const categoryIds = categories.map(c => c.id);
    const existingCount = await ServiceCategory.countDocuments({
      _id: { $in: categoryIds },
      merchantId: req.user._id,
      deletedAt: null
    });

    if (existingCount !== categories.length) {
      return next(new ApiError('One or more categories are invalid or do not belong to you', 400));
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
      return next(new ApiError('Category not found', 404));
    }

    const linkedServicesCount = await Service.countDocuments({
      categoryId: category._id,
      provider: req.user._id
    });

    if (linkedServicesCount > 0) {
      if (!action) {
        return next(new ApiError('Action required because category contains services', 400));
      }

      if (action === 'move') {
        if (!targetCategoryId) {
          return next(new ApiError('Target category ID required', 400));
        }
        const targetCat = await ServiceCategory.findOne({
          _id: targetCategoryId,
          merchantId: req.user._id,
          deletedAt: null
        });
        if (!targetCat) {
          return next(new ApiError('Target category not found', 404));
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
        return next(new ApiError('Invalid action', 400));
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
