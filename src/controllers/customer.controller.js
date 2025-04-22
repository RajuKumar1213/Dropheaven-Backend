import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import bcrypt from 'bcryptjs';
import { Customer } from '../models/Customer.models.js';

import { ApiResponse } from '../utils/ApiResponse.js';
import { sendOtpToMail } from '../utils/sendOtpOnMail.js';
import EmailOtp from '../models/EmailOtp.models.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';

// writing function for generating referesh and acces tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const customer = await Customer.findById(userId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
    const accessToken = customer.generateAccessToken();
    const refreshToken = customer.generateRefreshToken();

    // updating user with  referesh token
    customer.refreshToken = refreshToken;
    await customer.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new ApiError(
      500,
      'Something went wrong while generating access and referesh token.'
    );
  }
};

//  REGISTER USER **
const updateCustomerDetails = asyncHandler(async (req, res) => {
  const { name, phone, address, state, pinCode } = req.body;
  const profileLocalPath = req?.file?.path;

  if (
    [name, phone, address, state, pinCode].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  if (!profileLocalPath) {
    throw new ApiError(400, 'Profile picture is required!');
  }

  // Pull customer directly from req.user
  const customer = await Customer.findById(req.user._id);
  if (!customer || !customer.isVerified) {
    throw new ApiError(
      403,
      'Customer is not verified. Please verify your email first.'
    );
  }

  if (customer.name && customer.phone && customer.address) {
    throw new ApiError(
      400,
      'Details are already filled. You cannot update them again.'
    );
  }

  let customerAvatar;
  try {
    customerAvatar = await uploadOnCloudinary(profileLocalPath);

    if (!customerAvatar) {
      throw new ApiError(400, 'Profile not uploaded. Please try again.');
    }

    // Update customer details
    customer.name = name;
    customer.phone = phone;
    customer.address = address;
    customer.state = state;
    customer.pinCode = pinCode;
    customer.profilePicture = customerAvatar?.secure_url;
    await customer.save();

    return res
      .status(201)
      .json(new ApiResponse(200, {}, 'Customer details updated successfully!'));
  } catch (error) {
    if (customerAvatar?.public_id) {
      await deleteFromCloudinary(customerAvatar.public_id);
    }
    throw new ApiError(
      500,
      error?.message || 'Something went wrong while updating details.'
    );
  }
});

// Route to send OTP
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
  // update email in customer model
  let customerWithEmail = await Customer.findOne({ email });
  if (!customerWithEmail) {
    customerWithEmail = new Customer({ email });
    await customerWithEmail.save();
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

  // OTP is valid, update the customer's phone number as verified
  const customer = await Customer.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    customer._id
  );

  const savedCustomer = await Customer.findById(customer._id).select(
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
          user: savedCustomer,
          accessToken,
          refreshToken,
        },
        'User logged In successfully.'
      )
    );
});

const getCustomerAccountDetails = asyncHandler(async (req, res) => {
  // 👮‍♂️ Check if the logged-in user is a Customer
  if (req.user.role !== 'Customer') {
    throw new ApiError(
      403,
      'Access denied. Only Customers can access this route.'
    );
  }

  // 🧠 Fetch from DB just to be safe (in case you want the latest data)
  const customer = await Customer.findById(req.user._id).select(
    '-refreshToken -password -__v'
  );

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { customer, role: req.user.role },
        'Customer account fetched successfully'
      )
    );
});

export {
  updateCustomerDetails,
  sendMail,
  verifyOtp,
  getCustomerAccountDetails,
};
