const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  totalHours: { type: String },  // Thay đổi từ Number sang String
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;