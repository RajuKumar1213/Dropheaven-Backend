import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const companySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /.+\@.+\..+/,
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      match: /^\d{10}$/, // Assuming a 10-digit phone number
    },
    watsappNumber: {
      type: String,
      unique: true,
      trim: true,
      match: /^\d{10}$/, // Assuming a 10-digit phone number
    },
    address: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
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
    },
    verificationTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

// hash the password before saving it to the database
// customerSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();

//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // compare the hashed password with entered password
// customerSchema.methods.isPasswordCorrect = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// create a method for generating accessToken
companySchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userType: 'Company',
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Create a method to generate Refresh Token
companySchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      userType: 'Company',
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Company = mongoose.model('Company', companySchema);
