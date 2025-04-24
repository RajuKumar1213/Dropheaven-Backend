import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /.+\@.+\..+/,
      index: true, // ⚡ Index for faster email-based lookup
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
      match: /^\d{10}$/, // Assuming a 10-digit phone number
      index: true, // ⚡ Index for faster phone-based lookup
    },
    address: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
      index: true, // ⚡ Index for faster token-based lookup
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true, // Optional but useful if filtering by verification status
    },
    state: {
      type: String,
      trim: true,
    },
    pinCode: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    verificationToken: {
      type: String,
      index: true, // ⚡ Very useful for OTP verification flow
    },
    verificationTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

// 🚀 Access token method
customerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userType: 'Customer',
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// 🔁 Refresh token method
customerSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userType: 'Customer',
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Customer = mongoose.model('Customer', customerSchema);
