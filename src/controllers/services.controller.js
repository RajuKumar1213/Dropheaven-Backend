import asyncHandler from '../utils/asyncHandler.js';
import { Service } from '../models/Service.models.js';
import { ServiceCategory } from '../models/ServiceCategory.models.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ==============================
// SERVICE CATEGORY CONTROLLERS
// ==============================

// Get all service categories
const getAllServiceCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({});

  return res
    .status(200)
    .json(new ApiResponse(200, categories, 'All categories fetched'));
});

// Get single service category by ID
const getServiceCategory = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Service category not found');
  return res
    .status(200)
    .json(new ApiResponse(200, category, 'Category fetched'));
});

// Create service category
const createServiceCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existing = await ServiceCategory.findOne({ name });
  if (existing)
    throw new ApiError(400, 'Category with this name already exists');

  const category = await ServiceCategory.create({ name, description });
  return res
    .status(201)
    .json(new ApiResponse(201, category, 'Category created'));
});

// =====================
// SERVICE CONTROLLERS
// =====================

// Get all services
const getAllServices = asyncHandler(async (req, res) => {
  const groupedServices = await Service.aggregate([
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'categories',
      },
    },
    {
      $unwind: '$categories',
    },
    {
      $group: {
        _id: '$categories.name',
        services: {
          $push: {
            name: '$name',
            description: '$description',
            _id: '$_id',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        services: 1,
      },
    },
    {
      $sort: { category: 1 }, // optional: alphabetical sorting
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, groupedServices, 'All services grouped by category')
    );
});

// Get service by ID
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    'category',
    'name'
  );
  if (!service) throw new ApiError(404, 'Service not found');
  return res.status(200).json(new ApiResponse(200, service, 'Service fetched'));
});

// Get services by category ID
const getServicesByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const services = await Service.find({ category: categoryId }).populate(
    'category',
    'name'
  );
  return res
    .status(200)
    .json(new ApiResponse(200, services, 'Services by category fetched'));
});

// Create a new service
const createService = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  const categoryExists = await ServiceCategory.findById(category);
  if (!categoryExists) throw new ApiError(400, 'Invalid service category ID');

  const service = await Service.create({ name, description, category });
  return res.status(201).json(new ApiResponse(201, service, 'Service created'));
});

export {
  getAllServiceCategories,
  getServiceCategory,
  createServiceCategory,
  getAllServices,
  getService,
  getServicesByCategory,
  createService,
};
