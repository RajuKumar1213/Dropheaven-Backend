import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Customer } from '../models/Customer.models.js';
import { Professionals } from '../models/Professional.models.js';
import { Company } from '../models/Company.models.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized request. Token missing.');
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user = null;

    switch (decodedToken.userType) {
      case 'Customer':
        user = await Customer.findById(decodedToken._id).select(
          '-refreshToken'
        );
        break;
      case 'CaCs':
        user = await Professionals.findById(decodedToken._id).select(
          '-refreshToken'
        );
        break;
      case 'Company':
        user = await Company.findById(decodedToken._id).select('-refreshToken');
        break;
      default:
        throw new ApiError(401, 'Invalid user type.');
    }

    console.log('user', user);

    if (!user) {
      throw new ApiError(401, 'Invalid user or user not found.');
    }

    req.user = { ...user.toObject(), role: decodedToken.userType };
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || 'Invalid or expired access token.'
    );
  }
});
