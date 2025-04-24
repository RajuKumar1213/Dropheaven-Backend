import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Service = mongoose.model('Service', serviceSchema);
