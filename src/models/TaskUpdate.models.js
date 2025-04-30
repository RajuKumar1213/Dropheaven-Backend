import mongoose from 'mongoose';

const taskUpdateSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    rejectReason: {
      type: String,
    },
    previousStatus: {
      type: String,
      enum: [
        'NEW',
        'DOCUMENTS_UPLOADED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
      ],
    },
    newStatus: {
      type: String,
      enum: [
        'NEW',
        'DOCUMENTS_UPLOADED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
      ],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'updatedByRole',
      required: true,
    },
    updatedByRole: {
      type: String,
      required: true,
      enum: ['Customer', 'Professional', 'Company'],
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        name: String,
        path: String,
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
taskUpdateSchema.index({ task: 1, createdAt: -1 });
taskUpdateSchema.index({ updatedBy: 1 });

export const TaskUpdate = mongoose.model('TaskUpdate', taskUpdateSchema);
