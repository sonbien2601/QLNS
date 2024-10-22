// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  morningCheckIn: {
    type: Date,
    default: null
  },
  morningCheckOut: {
    type: Date,
    default: null
  },
  afternoonCheckIn: {
    type: Date,
    default: null
  },
  afternoonCheckOut: {
    type: Date,
    default: null
  },
  totalHours: {
    type: String,
    default: '0 giờ 0 phút'
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Tạo index cho tìm kiếm nhanh hơn
attendanceSchema.index({ userId: 1, date: 1 });

// Validate không cho phép check-out trước check-in
attendanceSchema.pre('save', function(next) {
  if (this.morningCheckOut && this.morningCheckIn) {
    if (new Date(this.morningCheckOut) < new Date(this.morningCheckIn)) {
      next(new Error('Thời gian check-out buổi sáng không thể trước check-in'));
      return;
    }
  }
  
  if (this.afternoonCheckOut && this.afternoonCheckIn) {
    if (new Date(this.afternoonCheckOut) < new Date(this.afternoonCheckIn)) {
      next(new Error('Thời gian check-out buổi chiều không thể trước check-in'));
      return;
    }
  }
  
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;