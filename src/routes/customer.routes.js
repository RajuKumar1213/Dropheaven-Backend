import express from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
  sendMail,
  verifyOtp,
  updateCustomerDetails,
  getCustomerAccountDetails,
} from '../controllers/customer.controller.js';

const router = express.Router();

router.post('/send-otp', sendMail);
router.post('/verify-otp', verifyOtp);

// secured routes

router
  .route('/fill-details')
  .patch(verifyJWT, upload.single('customerAvatar'), updateCustomerDetails);

router.get('/get-details', verifyJWT, getCustomerAccountDetails);

export default router;
 