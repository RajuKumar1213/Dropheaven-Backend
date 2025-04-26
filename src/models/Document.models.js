import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedByRole: {
      type: String,
      required: true,
      enum: ['Customer', 'Professional', 'Company'],
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model('Document', DocumentSchema);
