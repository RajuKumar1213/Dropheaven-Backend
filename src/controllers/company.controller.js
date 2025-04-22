import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Company } from '../models/Company.models.js';
import EmailOtp from '../models/EmailOtp.models.js';
import { sendOtpToMail } from '../utils/sendOtpOnMail.js';

// Generate Access and Refresh Tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const company = await Company.findById(userId);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }
    const accessToken = company.generateAccessToken();
    const refreshToken = company.generateRefreshToken();

    // Update company with refresh token
    company.refreshToken = refreshToken;
    await company.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh tokens.'
    );
  }
};

// Register Company
const registerCompany = asyncHandler(async (req, res) => {
  try {
    const { phone, watsappNumber, address, city, state, pinCode } = req.body;

    // Validate input
    if (
      [phone, watsappNumber, address, city, state, pinCode].some(
        (field) => field?.trim() === ''
      )
    ) {
      throw new ApiError(400, 'All fields are required');
    }

    const existedCompany = await Company.findById(req.user._id);
    if (!existedCompany || !existedCompany.isVerified) {
      throw new ApiError(
        403,
        'Professional is not verified. Please verify your email first.'
      );
    }

    if (existedCompany.name && existedCompany.phone && existedCompany.address) {
      throw new ApiError(
        400,
        'Details are already filled. You cannot update them again.'
      );
    }

    // Update professional details
    existedCompany.phone = phone;
    existedCompany.address = address;
    existedCompany.city = city;
    existedCompany.state = state;
    existedCompany.pinCode = pinCode;
    existedCompany.watsappNumber = watsappNumber;

    await existedCompany.save({ validateBeforeSave: false });

    if (!existedCompany) {
      throw new ApiError(500, 'Failed to fill professional details');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Company details filled successfully!'));
  } catch (error) {
    throw error;
  }
});
// Verify OTP
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

  // OTP is valid, update the company as verified
  const company = await Company.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    company._id
  );

  const savedCompany = await Company.findById(company._id).select(
    '-refreshToken'
  );

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
          user: savedCompany,
          accessToken,
          refreshToken,
        },
        'Company logged in successfully.'
      )
    );
});

// Fetch Company Details
const fetchDetails = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Company') {
    throw new ApiError(403, 'Access denied. Only Companies access this route.');
  }

  try {
    // Fetch company details by ID
    const company = await Company.findById(req.user._id).select(
      '-refreshToken'
    );

    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { company, role: req.user.role },
          'Company details fetched successfully'
        )
      );
  } catch (error) {
    throw error;
  }
});

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

  // Update email in company model
  let companyWithEmail = await Company.findOne({ email });
  if (!companyWithEmail) {
    companyWithEmail = new Company({ email });
    await companyWithEmail.save();
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

export { registerCompany, verifyOtp, fetchDetails, sendMail };
