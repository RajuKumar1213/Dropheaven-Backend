import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 100, // Default high number for normal ordering
    },
  },
  {
    timestamps: true,
  }
);

export const ServiceCategory = mongoose.model(
  'ServiceCategory',
  serviceCategorySchema
);
