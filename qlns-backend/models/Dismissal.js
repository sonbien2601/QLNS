// models/Dismissal.js
const mongoose = require('mongoose');

const dismissalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true,
    index: true // Thêm index cho tìm kiếm nhanh
  },
  oldPosition: {
    type: String,
    required: true
  },
  newPosition: {
    type: String, 
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true, // Tự động trim whitespace
    maxLength: 1000 // Giới hạn độ dài
  },
  effectiveDate: {
    type: Date,
    required: true,
    index: true, // Thêm index cho tìm kiếm theo ngày
    validate: { // Thêm validate ngày không trong quá khứ
      validator: function(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      message: 'Ngày hiệu lực không được trong quá khứ'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true // Thêm index cho lọc theo trạng thái
  },
  adminResponse: {
    type: String,
    default: null,
    trim: true,
    maxLength: 500
  },
  approvalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Approval',
    default: null,
    index: true
  },
  processedBy: { // Thêm thông tin người xử lý
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    default: null
  },
  processedAt: { // Thêm thời gian xử lý
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Thêm indexes cho tìm kiếm hiệu quả
dismissalSchema.index({ status: 1, createdAt: -1 });
dismissalSchema.index({ userId: 1, status: 1 });

// Thêm virtual field để kiểm tra có thể chỉnh sửa
dismissalSchema.virtual('isEditable').get(function() {
  return this.status === 'pending';
});

// Pre-save middleware để tự động cập nhật thời gian xử lý
dismissalSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.processedAt = new Date();
  }
  next();
});

// Instance methods
dismissalSchema.methods.canBeProcessedBy = function(userId) {
  return this.status === 'pending' && (!this.processedBy || this.processedBy.toString() === userId.toString());
};

dismissalSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Static methods
dismissalSchema.statics.findPendingDismissals = function() {
  return this.find({ status: 'pending' })
    .populate('userId', 'fullName position')
    .populate('createdBy', 'fullName position')
    .sort({ createdAt: -1 });
};

dismissalSchema.statics.findByUser = function(userId) {
  return this.find({ userId })
    .populate('createdBy', 'fullName position')
    .populate('processedBy', 'fullName position')
    .sort({ createdAt: -1 });
};

const Dismissal = mongoose.model('Dismissal', dismissalSchema);
module.exports = Dismissal;