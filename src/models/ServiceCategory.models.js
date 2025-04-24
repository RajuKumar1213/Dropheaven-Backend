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
  },
  {
    timestamps: true,
  }
);

export const ServiceCategory = mongoose.model(
  'ServiceCategory',
  serviceCategorySchema
);
