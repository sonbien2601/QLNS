const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  oldPosition: { type: String, required: true },
  newPosition: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'waiting_admin'], // Thêm trạng thái mới
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  // Thêm các trường mới cho HR
  hrFeedback: { type: String },
  hrFeedbackAt: { type: Date },
  hrAction: {
    type: String,
    enum: ['approve', 'reject'],
    required: false
  },
  hrProcessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User2' }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;