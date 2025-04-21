import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Professionals } from '../models/Professional.models.js';
import EmailOtp from '../models/EmailOtp.models.js';
import { sendOtpToMail } from '../utils/sendOtpOnMail.js';

// Generate Access and Refresh Tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const professional = await Professionals.findById(userId);
    if (!professional) {
      throw new ApiError(404, 'Professional not found');
    }
    const accessToken = professional.generateAccessToken();
    const refreshToken = professional.generateRefreshToken();

    // Update professional with refresh token
    professional.refreshToken = refreshToken;
    await professional.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh tokens.'
    );
  }
};

// Register Professional
const registerProfessional = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      experience,
      address,
      city,
      state,
      pinCode,
    } = req.body;

    // Validate input
    if (
      [
        name,
        email,
        phone,
        specialization,
        experience,
        address,
        city,
        state,
        pinCode,
      ].some((field) => field?.trim() === '')
    ) {
      throw new ApiError(400, 'All fields are required');
    }

    // Check if professional already exists
    const existingProfessional = await Professionals.findOne({ email });
    if (existingProfessional) {
      throw new ApiError(409, 'Professional with this email already exists');
    }

    // Create new professional
    const professional = new Professionals({
      name,
      phone,
      specialization,
      experience,
      address,
      city,
      state,
      pinCode,
      role,
      profilePicture,
      addharCard,
      panCard,
    });

    await professional.save();

    if (!professional) {
      throw new ApiError(500, 'Failed to register professional');
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { professional },
          'Professional registered successfully!'
        )
      );
  } catch (error) {
    throw error;
  }
});

// Verify OTP

const sendMail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const otp = await sendOtpToMail(email);

  if (!otp) {
    throw new ApiError(500, 'Failed to send OTP');
  }

  const hashedOtp = await bcrypt.hash(otp.toString(), 10);

  // Update email in professional model
  let professionalWithEmail = await Professionals.findOne({ email });
  if (!professionalWithEmail) {
    professionalWithEmail = new Professionals({ email });
    await professionalWithEmail.save();
  }

  const existingRecord = await EmailOtp.findOne({ email });

  if (existingRecord) {
    existingRecord.otp = hashedOtp;
    await existingRecord.save();
  } else {
    await EmailOtp.create({ email, otp: hashedOtp });
  }

  console.log(`OTP sent to ${email}`);

  res.status(200).json(new ApiResponse(200, otp, 'OTP sent successfully'));
});

// Route to verify OTP

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  // Find the OTP record in the database
  const otpRecord = await EmailOtp.findOne({ email });

  if (!otpRecord) {
    throw new ApiError(400, 'OTP Expired, please request a new one to login.');
  }

  // Compare the provided OTP with the hashed OTP in the database
  const isMatch = await bcrypt.compare(otp, otpRecord.otp);

  if (!isMatch) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // OTP is valid, update the professional as verified
  const professional = await Professionals.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );

  if (!professional) {
    throw new ApiError(404, 'Professional not found');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    professional._id
  );

  const savedProfessional = await Professionals.findById(
    professional._id
  ).select('-refreshToken');

  // Delete the OTP record after successful verification
  await EmailOtp.deleteOne({ email });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: savedProfessional,
          accessToken,
          refreshToken,
        },
        'Professional logged in successfully.'
      )
    );
});

export { registerProfessional, verifyOtp, sendMail };
