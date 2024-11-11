const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    enum: [
      'create_user',
      'update_user',
      'delete_user',
      'update_contract',
      'update_salary',
      'dismiss_employee',
      'approve_resignation',
      'appointment_approval'
    ],
    index: true
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    // Thêm validate cho requestData
    validate: {
      validator: function (data) {
        switch (this.requestType) {
          case 'update_contract':
            return data.contractId && data.updateData && data.oldData;
          case 'create_user':
            return data.username && data.email;
          case 'update_user':
            return data.userId && data.updateData;
          case 'appointment_approval': // Thêm validation cho appointment
            return data.appointmentId && data.userId && data.oldPosition && data.newPosition;
          default:
            return true;
        }
      },
      message: 'RequestData không hợp lệ cho loại yêu cầu này'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waiting_admin'], // Thêm waiting_admin
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminResponse: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    index: true
  },
  processedAt: {
    type: Date,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
approvalSchema.index({ status: 1, createdAt: -1 });
approvalSchema.index({ requestedBy: 1, status: 1 });
approvalSchema.index({ requestType: 1, status: 1 });

// Pre-save middleware
approvalSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status !== 'pending') {
    if (!this.processedAt) this.processedAt = new Date();
    if (!this.processedBy) {
      return next(new Error('ProcessedBy required when approving/rejecting'));
    }
    if (!this.adminResponse) {
      return next(new Error('Admin response required when approving/rejecting'));
    }
  }
  next();
});

// Instance methods
approvalSchema.methods.isProcessable = function () {
  return this.status === 'pending';
};

approvalSchema.methods.canBeProcessedBy = function (userId) {
  return !this.processedBy || this.processedBy.toString() === userId.toString();
};

const Approval = mongoose.model('Approval', approvalSchema);
module.exports = Approval;