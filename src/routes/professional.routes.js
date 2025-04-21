import Router from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

import {
  sendMail,
  verifyOtp,
  registerProfessional,
  fetchDetails,
} from '../controllers/professional.controller.js';

const router = Router();

router.route('/send-mail').post(sendMail);
router.route('/verify-otp').post(verifyOtp);

// secure route
router.route('/fill-details').patch(
  verifyJWT,
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'addharCard',
      maxCount: 1,
    },
    {
      name: 'panCard',
      maxCount: 1,
    },
  ]),
  registerProfessional
);
router.route('/fetch-details').get(verifyJWT, fetchDetails);

export default router;
