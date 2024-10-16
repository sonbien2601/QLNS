const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Liên kết với User2 model, lưu ID của nhân viên chấm công
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  totalHours: { type: String },  // Lưu tổng số giờ làm việc dưới dạng chuỗi
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;