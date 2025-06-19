import mongoose from 'mongoose';
import authConfig from '../config/auth.config.js';

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  status: {
    type: String,
    enum: authConfig.workflowStatuses,
    default: 'active'
  },
  steps: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: authConfig.stepStatuses,
      default: 'pending'
    },
    triggerType: {
      type: String,
      enum: ['manual', 'automatic', 'conditional'],
      default: 'manual'
    },
    triggerConditions: [{
      type: {
        type: String,
        enum: ['time', 'event', 'status']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    triggerActions: [{
      type: {
        type: String,
        enum: ['notification', 'status_update', 'message']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    startDate: Date,
    dueDate: Date,
    completedAt: Date
  }],
  currentStep: {
    type: Number,
    default: 0
  },
  metadata: {
    totalSteps: Number,
    progress: Number,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Indexes
workflowSchema.index({ group: 1, status: 1 });
workflowSchema.index({ name: 'text' });

// Pre-save middleware to update metadata
workflowSchema.pre('save', function(next) {
  this.metadata = {
    totalSteps: this.steps.length,
    progress: (this.currentStep / this.steps.length) * 100,
    lastUpdated: new Date()
  };
  next();
});

// Methods
workflowSchema.methods.advanceStep = function() {
  if (this.currentStep < this.steps.length - 1) {
    this.currentStep += 1;
    return true;
  }
  return false;
};

workflowSchema.methods.updateStepStatus = function(stepIndex, status) {
  if (stepIndex >= 0 && stepIndex < this.steps.length) {
    this.steps[stepIndex].status = status;
    if (status === 'completed') {
      this.steps[stepIndex].completedAt = new Date();
    }
    return true;
  }
  return false;
};

workflowSchema.methods.assignStep = function(stepIndex, userId) {
  if (stepIndex >= 0 && stepIndex < this.steps.length) {
    this.steps[stepIndex].assignee = userId;
    return true;
  }
  return false;
};

export default mongoose.model('Workflow', workflowSchema);
