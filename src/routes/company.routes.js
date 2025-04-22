import Router from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

import {
  sendMail,
  verifyOtp,
  registerCompany,
  fetchDetails,
} from '../controllers/company.controller.js';

const router = Router();

router.route('/send-mail').post(sendMail);
router.route('/verify-otp').post(verifyOtp);

// secure route
router.route('/fill-details').patch(
  verifyJWT,
  upload.single('profilePicture'),
  registerCompany
);
router.route('/fetch-details').get(verifyJWT, fetchDetails);

export default router;
