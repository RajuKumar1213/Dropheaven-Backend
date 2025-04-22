import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const professionalSchema = new mongoose.Schema(
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
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
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
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    assigedCustomers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    role: {
      type: String,
      enum: ['CA', 'CS'],
      default: 'CA',
    },
    addharCard: {
      type: String,
    },
    panCard: {
      type: String,
    },
  },
  { timestamps: true }
);

professionalSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userType: 'Professional',
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Create a method to generate Refresh Token
professionalSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userType: 'Professional',
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Professionals =
  mongoose.models.professionals ||
  mongoose.model('Professional', professionalSchema);
