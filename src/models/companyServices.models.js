import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'REGISTRATION',
        'COMPANY_REGISTRATION',
        'TAX_COMPLIANCE',
        'BUSINESS_INDUSTRY',
        'OTHER_SERVICES',
      ],
      required: true,
    },
    subItems: [
      {
        type: String, // e.g., "NGO REGISTRATION", "TRADEMARK REGISTRATION"
        trim: true,
      },
    ],
    description: {
      type: String,
      default: '',
    },
    documentsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
