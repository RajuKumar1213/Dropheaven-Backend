import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: { type: Date, default: Date.now },
 
  serviceType: { type: String, required: true }, // e.g., "NGO_REGISTRATION", "PRIVATE_LIMITED"
  serviceCategory: { type: String, required: true }, // e.g., "REGISTRATION_SERVICES", "TAX_AND_COMPLIANCE"
});

export const Document = mongoose.model('Document', DocumentSchema);
