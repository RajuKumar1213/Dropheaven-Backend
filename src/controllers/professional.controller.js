import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Professionals } from '../models/Professional.models.js';
import EmailOtp from '../models/EmailOtp.models.js';
import { sendOtpToMail } from '../utils/sendOtpOnMail.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

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
  console.log('user', req.user);
  try {
    const {
      name,
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

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const addharCardLocalPath = req.files?.addharCard[0]?.path;
    const panCardLocalPath = req.files?.panCard[0]?.path;

    if (!avatarLocalPath || !addharCardLocalPath || !panCardLocalPath) {
      throw new ApiError(400, 'All files are required!');
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const addharCard = await uploadOnCloudinary(addharCardLocalPath);
    const panCard = await uploadOnCloudinary(panCardLocalPath);

    if (!avatar) {
      throw new ApiError(400, 'Avatar not uploaded. Please try again.');
    }
    if (!addharCard) {
      throw new ApiError(400, 'Aadhar card not uploaded. Please try again.');
    }
    if (!panCard) {
      throw new ApiError(400, 'PAN card not uploaded. Please try again.');
    }

    const professionalDetails = await Professionals.findById(req.user._id);
    if (!professionalDetails || !professionalDetails.isVerified) {
      throw new ApiError(
        403,
        'Professional is not verified. Please verify your email first.'
      );
    }

    if (
      professionalDetails.name &&
      professionalDetails.phone &&
      professionalDetails.address
    ) {
      throw new ApiError(
        400,
        'Details are already filled. You cannot update them again.'
      );
    }

    // Update professional details
    professionalDetails.name = name;
    professionalDetails.phone = phone;
    professionalDetails.specialization = specialization;
    professionalDetails.experience = experience;
    professionalDetails.address = address;
    professionalDetails.city = city;
    professionalDetails.state = state;
    professionalDetails.pinCode = pinCode;
    professionalDetails.profilePicture = avatar?.secure_url;
    professionalDetails.addharCard = addharCard?.secure_url;
    professionalDetails.panCard = panCard?.secure_url;
    professionalDetails.isAvailable = true; // Set availability to true

    await professionalDetails.save();

    if (!professionalDetails) {
      throw new ApiError(500, 'Failed to fill professional details');
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, 'Professional details filled successfully!')
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

const fetchDetails = asyncHandler(async (req, res) => {
  try {
    // Fetch professional details by ID
    const professional = await Professionals.findById(req.user._id).select(
      '-refreshToken'
    );

    if (!professional) {
      throw new ApiError(404, 'Professional not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          professional,
          'Professional details fetched successfully'
        )
      );
  } catch (error) {
    throw error;
  }
});

export { registerProfessional, verifyOtp, sendMail, fetchDetails };
