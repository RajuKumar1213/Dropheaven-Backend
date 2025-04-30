// routes/serviceRoutes.js
import express from 'express';
const router = express.Router();
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  addTaskUpdate,
  assignTaskToProfessional,
  createTask,
  deleteDocument,
  getCompanyTasks,
  getCustomerTasks,
  getProfessionalTasks,
  getTaskDetails,
  updateTaskPriority,
  uploadCompanyDocuments,
  uploadFinalDocsByProfessional,
} from '../controllers/task.controller.js';
import {
  isCustomer,
  isCompany,
  isProfessional,
} from '../middleware/roleCheck.middleware.js';
import {
  cleanupFiles,
  documentUpload,
} from '../middleware/multer.middleware.js';

// Public routes (no verifyJWTentication needed)

// verifyJWTenticated routes
router.post(
  '/new',
  verifyJWT,
  isCustomer,
  documentUpload,
  cleanupFiles,
  createTask
);
router.get('/customer', verifyJWT, isCustomer, getCustomerTasks);
router.get('/customer/:taskId', verifyJWT, isCustomer, getTaskDetails);
router.post('/customer/:taskId/updates', verifyJWT, isCustomer, addTaskUpdate);

// Company Routes
router.get('/company', verifyJWT, isCompany, getCompanyTasks);
router.get('/company/:taskId', verifyJWT, isCompany, getTaskDetails);
router.post('/company/:taskId/updates', verifyJWT, isCompany, addTaskUpdate);
router.post(
  '/company/:taskId/assign',
  verifyJWT,
  isCompany,
  assignTaskToProfessional
);
router.patch(
  '/company/:taskId/priority',
  verifyJWT,
  isCompany,
  updateTaskPriority
);

// Professional Routes
router.get('/professional', verifyJWT, isProfessional, getProfessionalTasks);
router.get('/professional/:taskId', verifyJWT, isProfessional, getTaskDetails);
router.post(
  '/professional/:taskId/updates',
  verifyJWT,
  isProfessional,
  addTaskUpdate
);

router.post(
  '/company/:taskId/upload-document',
  verifyJWT,
  isCompany,
  documentUpload,
  cleanupFiles,
  uploadCompanyDocuments
);

router.post(
  '/professional/:taskId/upload-document',
  verifyJWT,
  isProfessional,
  documentUpload,
  cleanupFiles,
  uploadFinalDocsByProfessional
);

router.delete(
  '/professional/:taskId/delete',
  verifyJWT,
  isProfessional,
  deleteDocument
);

export default router;
