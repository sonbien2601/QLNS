// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Liên kết với User2 model, lưu ID của nhân viên yêu cầu bổ nhiệm
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  oldPosition: { type: String, required: true },
  newPosition: { type: String, required: true },
  reason: { type: String, required: true },
  // Trạng thái của yêu cầu bổ nhiệm
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;