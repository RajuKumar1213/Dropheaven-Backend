import Router from 'express';
import {
  sendMail,
  verifyOtp,
  registerProfessional,
} from '../controllers/professional.controller.js';

const router = Router();

router.route('/send-mail').post(sendMail);
router.route('/verify-otp').post(verifyOtp);

export default router;
