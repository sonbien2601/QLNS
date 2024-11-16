const mongoose = require('mongoose');
const leaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  type: {
    type: String,
    enum: ['leave', 'resignation'],
    required: true
  },
  startDate: {
    type: Date,
    required: function() {
      return this.type === 'leave';
    }
  },
  endDate: {
    type: Date,
    required: function() {
      return this.type === 'leave';
    }
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2'
  }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);