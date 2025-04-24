// routes/serviceRoutes.js
import express from 'express';
const router = express.Router();
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  createService,
  createServiceCategory,
  getAllServiceCategories,
  getAllServices,
  getService,
  getServiceCategory,
  getServicesByCategory,
} from '../controllers/services.controller.js';

// Public routes (no authentication needed)
router.get('/all-categories', getAllServiceCategories);
router.get('/categories/:id', getServiceCategory);
router.get('/all-services', getAllServices);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/:id', getService);

// Admin only routes
router.post('/category/create', verifyJWT, createServiceCategory);
router.post('/service/create', verifyJWT, createService);

export default router;
