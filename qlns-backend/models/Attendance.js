const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  date: { type: Date, required: true },
  morningCheckIn: { type: Date },
  morningCheckOut: { type: Date },
  afternoonCheckIn: { type: Date },
  afternoonCheckOut: { type: Date },
  totalHours: { type: String },
  status: { type: String, enum: ['present', 'late', 'absent'], default: 'absent' },
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;