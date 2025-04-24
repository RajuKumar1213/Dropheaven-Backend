import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professional',
      default: null,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'NEW',
        'DOCUMENTS_UPLOADED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
      ],
      default: 'NEW',
    },

    customerRequirements: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for documents
taskSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'task',
  justOne: false,
});

// Virtual for task updates
taskSchema.virtual('updates', {
  ref: 'TaskUpdate',
  localField: '_id',
  foreignField: 'task',
  justOne: false,
  options: { sort: { createdAt: -1 } },
});

// Indexes
taskSchema.index({ customer: 1, status: 1 });
taskSchema.index({ professional: 1, status: 1 });
taskSchema.index({ company: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model('Task', taskSchema);
