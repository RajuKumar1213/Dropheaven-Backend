import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true, // ⚡ Index for faster email-based lookup
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Document will automatically be removed after 5 minutes (300 seconds)
  },
});

const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);
export default EmailOtp;
