// Assuming you have this model
import { Task } from '../models/Task.models.js';
import { Service } from '../models/Service.models.js';
import { Company } from '../models/Company.models.js';
import { TaskUpdate } from '../models/TaskUpdate.models.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

// Create a new task (for customer)
const createTask = asyncHandler(async (req, res) => {
  const { serviceId, customerRequirements } = req.body;
  const customerId = req.user._id;

  // Validate service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(400, 'Service not found');
  }

  // Find an active company to assign the task to
  // In a production environment, you might have a more sophisticated assignment logic
  const companies = await Company.find({});
  if (!companies.length) {
    throw new ApiError(400, 'No active company found to handle your request');
  }

  const company = companies[0];

  // Create the task
  const task = await Task.create({
    customer: customerId,
    service: serviceId,
    company: company._id,
    customerRequirements,
  });

  // Create an initial task update
  await TaskUpdate.create({
    task: task._id,
    message: 'Task created',
    newStatus: 'NEW',
    updatedBy: customerId,
    updatedByRole: 'Customer',
  });

  // Return the created task with service details
  const createdTask = await Task.findById(task._id)
    .populate('service', 'name category')
    .populate({
      path: 'service',
      populate: {
        path: 'category',
        select: 'name',
      },
    });

  return res
    .status(201)
    .json(new ApiResponse(201, createdTask, 'Task created successfully'));
});

// Get all tasks for current customer
const getCustomerTasks = asyncHandler(async (req, res) => {
  const customerId = req.user._id;

  const tasks = await Task.aggregate([
    {
      $match: { customer: new mongoose.Types.ObjectId(customerId) },
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails',
      },
    },
    { $unwind: '$serviceDetails' },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'serviceDetails.category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    { $unwind: '$categoryDetails' },
    {
      $lookup: {
        from: 'taskupdates',
        let: { taskId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$task', '$$taskId'] },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'latestUpdate',
      },
    },
    {
      $addFields: {
        latestUpdate: { $arrayElemAt: ['$latestUpdate', 0] },
      },
    },
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'task',
        as: 'documents',
      },
    },
    {
      $addFields: {
        documentCount: { $size: '$documents' },
      },
    },
    {
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        serviceName: '$serviceDetails.name',
        categoryName: '$categoryDetails.name',
        latestUpdateMessage: '$latestUpdate.message',
        latestUpdateDate: '$latestUpdate.createdAt',
        documentCount: 1,
        professional: 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  if (!tasks.length) {
    throw new ApiError(404, 'No tasks found for this customer');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, 'Customer tasks fetched successfully'));
});

// Get a single task with full details
const getTaskDetails = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  let matchCondition = { _id: new mongoose.Types.ObjectId(taskId) };

  if (userRole === 'Customer') {
    matchCondition.customer = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'Professional') {
    matchCondition.professional = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'Company') {
    matchCondition.company = new mongoose.Types.ObjectId(userId);
  }

  const taskDetails = await Task.aggregate([
    {
      $match: matchCondition,
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails',
      },
    },
    { $unwind: '$serviceDetails' },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'serviceDetails.category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    { $unwind: '$categoryDetails' },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerDetails',
      },
    },
    { $unwind: '$customerDetails' },
    {
      $lookup: {
        from: 'professionals',
        localField: 'professional',
        foreignField: '_id',
        as: 'professionalDetails',
      },
    },
    {
      $unwind: {
        path: '$professionalDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'task',
        as: 'documents',
      },
    },
    {
      $lookup: {
        from: 'taskupdates',
        localField: '_id',
        foreignField: 'task',
        as: 'updates',
      },
    },
    {
      $addFields: {
        updates: {
          $filter: {
            input: '$updates',
            as: 'update',
            cond: {
              $or: [
                { $ne: [userRole, 'Customer'] },
                { $eq: ['$$update.isInternal', false] },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        status: 1,
        priority: 1,
        notes: 1,
        customerRequirements: 1,
        createdAt: 1,
        updatedAt: 1,
        assignedAt: 1,
        completedAt: 1,
        service: {
          _id: '$serviceDetails._id',
          name: '$serviceDetails.name',
          description: '$serviceDetails.description',
          requiredDocuments: '$serviceDetails.requiredDocuments',
          category: {
            _id: '$categoryDetails._id',
            name: '$categoryDetails.name',
          },
        },
        customer: {
          _id: '$customerDetails._id',
          name: '$customerDetails.name',
          email: '$customerDetails.email',
          phone: '$customerDetails.phone',
        },
        professional: {
          $cond: {
            if: '$professionalDetails',
            then: {
              _id: '$professionalDetails._id',
              name: '$professionalDetails.name',
              email: '$professionalDetails.email',
              specialization: '$professionalDetails.specialization',
            },
            else: null,
          },
        },
        documents: 1,
        updates: {
          $map: {
            input: {
              $sortArray: { input: '$updates', sortBy: { createdAt: -1 } },
            },
            as: 'update',
            in: {
              _id: '$$update._id',
              message: '$$update.message',
              previousStatus: '$$update.previousStatus',
              newStatus: '$$update.newStatus',
              createdAt: '$$update.createdAt',
              attachments: '$$update.attachments',
            },
          },
        },
      },
    },
  ]);

  if (!taskDetails.length) {
    throw new ApiError(
      404,
      'Task not found or you do not have permission to view it'
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, taskDetails[0], 'Task details fetched successfully')
    );
});

// Add update to task
const addTaskUpdate = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { message, newStatus, isInternal } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Create strict match condition based on user role
  let matchCondition = { _id: new mongoose.Types.ObjectId(taskId) };

  if (userRole === 'Customer') {
    matchCondition.customer = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'Professional') {
    matchCondition.professional = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'Company') {
    matchCondition.company = new mongoose.Types.ObjectId(userId);
  }

  const task = await Task.findOne(matchCondition);

  if (!task) {
    throw new ApiError(
      404,
      'Task not found or you do not have permission to update it'
    );
  }

  const previousStatus = task.status;

  const taskUpdate = await TaskUpdate.create({
    task: new mongoose.Types.ObjectId(taskId),
    message,
    previousStatus,
    newStatus: newStatus || previousStatus,
    updatedBy: new mongoose.Types.ObjectId(userId),
    updatedByRole: userRole,
    isInternal: isInternal ?? false, // fallback if undefined
  });

  // Update task status if changed
  if (newStatus && newStatus !== previousStatus) {
    task.status = newStatus;

    // Update timestamps conditionally
    if (newStatus === 'ASSIGNED' && !task.assignedAt) {
      task.assignedAt = Date.now();
    } else if (newStatus === 'COMPLETED' && !task.completedAt) {
      task.completedAt = Date.now();
    }

    await task.save();
  }

  return res
    .status(201)
    .json(new ApiResponse(201, taskUpdate, 'Task update added successfully'));
});

// Get tasks for company with filtering and pagination
const getCompanyTasks = asyncHandler(async (req, res) => {
  const companyId = req.user._id;
  const { status, priority, search, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const matchStage = {
    company: new mongoose.Types.ObjectId(companyId),
  };

  //   if (status) {
  //     matchStage.status = status;
  //   }

  //   if (priority) {
  //     matchStage.priority = priority;
  //   }

  // Count total BEFORE search filter for pagination info
  //   const total = await Task.countDocuments(matchStage);

  const aggregatePipeline = [
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails',
      },
    },
    { $unwind: '$serviceDetails' },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerDetails',
      },
    },
    { $unwind: '$customerDetails' },
  ];

  // Add search filters if present
  if (search) {
    aggregatePipeline.push({
      $match: {
        $or: [
          { 'serviceDetails.name': { $regex: search, $options: 'i' } },
          { 'customerDetails.name': { $regex: search, $options: 'i' } },
          { 'customerDetails.email': { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ],
      },
    });
  }

  aggregatePipeline.push(
    {
      $lookup: {
        from: 'professionals',
        localField: 'professional',
        foreignField: '_id',
        as: 'professionalDetails',
      },
    },
    {
      $unwind: {
        path: '$professionalDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'task',
        as: 'documents',
      },
    },
    {
      $addFields: {
        documentCount: { $size: '$documents' },
      },
    },
    {
      $project: {
        _id: 1,
        status: 1,
        priority: 1,
        createdAt: 1,
        updatedAt: 1,
        serviceName: '$serviceDetails.name',
        customerName: '$customerDetails.name',
        customerEmail: '$customerDetails.email',
        professionalName: {
          $cond: {
            if: '$professionalDetails',
            then: '$professionalDetails.name',
            else: null,
          },
        },
        documentCount: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: (parsedPage - 1) * parsedLimit },
    { $limit: parsedLimit }
  );

  const tasks = await Task.aggregate(aggregatePipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        success: true,
        count: tasks.length,

        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          //   totalPages: Math.ceil(total / limit),
        },
        tasks: tasks,
      },
      'Company tasks fetched successfully'
    )
  );
});

// Get tasks for professional
const getProfessionalTasks = asyncHandler(async (req, res) => {
  const professionalId = req.user._id;
  const { status, priority, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const matchStage = {
    professional: new mongoose.Types.ObjectId(professionalId),
  };

  if (status) {
    matchStage.status = status;
  }

  // Total task count (before pagination)
  const total = await Task.countDocuments(matchStage);

  console.log('Total tasks:', total);

  const aggregatePipeline = [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails',
      },
    },
    { $unwind: '$serviceDetails' },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerDetails',
      },
    },
    { $unwind: '$customerDetails' },
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'task',
        as: 'documents',
      },
    },
    {
      $addFields: {
        documentCount: { $size: '$documents' },
      },
    },
    {
      $project: {
        _id: 1,
        status: 1,

        createdAt: 1,
        updatedAt: 1,
        assignedAt: 1,
        serviceName: '$serviceDetails.name',
        customerName: '$customerDetails.name',
        customerEmail: '$customerDetails.email',
        documentCount: 1,
      },
    },
    { $sort: { priority: -1, createdAt: -1 } },
    { $skip: (parsedPage - 1) * parsedLimit },
    { $limit: parsedLimit },
  ];

  const tasks = await Task.aggregate(aggregatePipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: tasks.length,
        total,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit),
        },
        tasks: tasks,
      },
      'Professional tasks fetched successfully'
    )
  );
});

// Assign task to professional (Company only)
const assignTaskToProfessional = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { professionalId, message } = req.body;
  const companyId = req.user._id;

  // Step 1: Get the task
  const task = await Task.findById(taskId).populate('customer');

  // Step 2: Check if task exists and belongs to this company
  // if (!task || String(task.company) !== String(companyId)) {
  //   throw new ApiError(404, 'Task not found or not owned by your company');
  // }

  // // Step 3: Check if the customer also belongs to this company
  // if (!task.customer || String(task.customer.company) !== String(companyId)) {
  //   throw new ApiError(
  //     403,
  //     'You cannot assign a task of a customer that does not belong to your company'
  //   );
  // }

  // Save previous status before updating
  const prevStatus = task.status;

  // Step 4: Assign the task
  task.professional = professionalId;
  task.status = 'ASSIGNED';
  task.assignedAt = new Date();

  await task.save();

  // Step 5: Log the task update
  await TaskUpdate.create({
    task: taskId,
    message: message || 'Task assigned to professional',
    previousStatus: prevStatus,
    newStatus: 'ASSIGNED',
    updatedBy: companyId,
    updatedByRole: 'Company',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        taskId,
        professionalId,
        status: 'ASSIGNED',
      },
      'Task assigned successfully'
    )
  );
});

// Update task priority (Company only)
const updateTaskPriority = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { priority } = req.body;
  const companyId = req.user._id;

  const task = await Task.findOne({
    _id: taskId,
    company: companyId,
  });

  if (!task) {
    throw new ApiError(404, 'Task not found or not owned by your company');
  }

  const previousPriority = task.priority;
  task.priority = priority;
  await task.save();

  await TaskUpdate.create({
    task: taskId,
    message: `Priority changed from ${previousPriority} to ${priority}`,
    previousStatus: null,
    newStatus: null,
    updatedBy: companyId,
    updatedByRole: 'Company',
    isInternal: true,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        taskId,
        priority,
      },
      'Task priority updated successfully'
    )
  );
});

// get professional tasks which is assigned to him/her by the company

// Export all functions
export {
  createTask,
  getCustomerTasks,
  getTaskDetails,
  addTaskUpdate,
  getCompanyTasks,
  getProfessionalTasks,
  assignTaskToProfessional,
  updateTaskPriority,
};
