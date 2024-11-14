const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  oldPosition: {
    type: String,
    required: true
  },
  newPosition: {
    type: String, 
    required: true
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waiting_admin'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: { 
    type: Date 
  },
  rejectedAt: { 
    type: Date 
  },
  hrFeedback: { 
    type: String 
  },
  hrFeedbackAt: { 
    type: Date 
  },
  hrAction: {
    type: String,
    enum: ['approve', 'reject']
  },
  hrProcessedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User2' 
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2'
  },
  displayStatus: {
    type: String,
    default: 'Chờ duyệt'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update displayStatus
appointmentSchema.pre('save', function(next) {
  switch(this.status) {
    case 'pending':
      this.displayStatus = 'Chờ duyệt';
      break;
    case 'waiting_admin':
      this.displayStatus = 'Chờ Admin duyệt';
      break;
    case 'approved':
      this.displayStatus = 'Đã duyệt';
      break;
    case 'rejected':
      this.displayStatus = 'Đã từ chối';
      break;
    default:
      this.displayStatus = 'Chờ duyệt';
  }
  next();
});

// Create indexes
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ userId: 1, status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;