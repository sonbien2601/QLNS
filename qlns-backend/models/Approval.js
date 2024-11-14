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
      'dismiss_employee',  // Thêm loại yêu cầu miễn nhiệm
      'approve_resignation',
      'appointment_approval'
    ],
    index: true
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (data) {
        switch (this.requestType) {
          case 'update_contract':
            return data.contractId && data.updateData && data.oldData;
          case 'create_user':
            return data.username && data.email;
          case 'update_user':
            return data.userId && data.updateData;
          case 'appointment_approval':
            return data.appointmentId && data.userId && data.oldPosition && data.newPosition;
          case 'dismiss_employee': // Thêm validation cho miễn nhiệm
            return (
              data.userId &&
              data.oldPosition &&
              data.newPosition &&
              data.reason &&
              data.effectiveDate
            );
          default:
            return true;
        }
      },
      message: props => {
        switch (props.value.requestType) {
          case 'dismiss_employee':
            return 'Yêu cầu miễn nhiệm phải có đầy đủ thông tin: userId, oldPosition, newPosition, reason và effectiveDate';
          default:
            return 'RequestData không hợp lệ cho loại yêu cầu này';
        }
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'waiting_admin', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true,
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
  },
  dismissalId: { // Thêm reference đến bản ghi miễn nhiệm
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dismissal',
    index: true
  },
  effectiveDate: { // Thêm ngày hiệu lực cho miễn nhiệm
    type: Date,
    validate: {
      validator: function(date) {
        if (this.requestType !== 'dismiss_employee') return true;
        return date && date >= new Date();
      },
      message: 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại'
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
approvalSchema.index({ status: 1, createdAt: -1 });
approvalSchema.index({ requestedBy: 1, status: 1 });
approvalSchema.index({ requestType: 1, status: 1 });
approvalSchema.index({ dismissalId: 1 }, { sparse: true }); // Thêm index cho dismissalId

// Pre-save middleware
approvalSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    if (!this.processedAt) this.processedAt = new Date();
    if (!this.processedBy) {
      return next(new Error('ProcessedBy required when approving/rejecting'));
    }
    if (!this.adminResponse) {
      return next(new Error('Admin response required when approving/rejecting'));
    }

    // Validate thêm cho miễn nhiệm
    if (this.requestType === 'dismiss_employee') {
      // Bỏ validation dismissalId vì dismissal sẽ được tạo sau
      if (!this.requestData.effectiveDate) {
        return next(new Error('Effective date required for dismissal'));
      }
    }
  }
  next();
});

// Instance methods
approvalSchema.methods.isProcessable = function() {
  return this.status === 'pending';
};

approvalSchema.methods.canBeProcessedBy = function(userId) {
  return !this.processedBy || this.processedBy.toString() === userId.toString();
};

// Thêm method kiểm tra hiệu lực của miễn nhiệm
approvalSchema.methods.isEffective = function() {
  if (this.requestType !== 'dismiss_employee') return true;
  return this.status === 'approved' && 
    this.effectiveDate && 
    new Date(this.effectiveDate) <= new Date();
};

// Static methods
approvalSchema.statics.findPendingDismissals = function() {
  return this.find({
    requestType: 'dismiss_employee',
    status: 'pending'
  })
  .populate('requestedBy', 'fullName position')
  .sort({ createdAt: -1 });
};

approvalSchema.statics.findDismissalsByUser = function(userId) {
  return this.find({
    requestType: 'dismiss_employee',
    'requestData.userId': userId
  })
  .populate('requestedBy', 'fullName position')
  .populate('processedBy', 'fullName position')
  .sort({ createdAt: -1 });
};

const Approval = mongoose.model('Approval', approvalSchema);
module.exports = Approval;