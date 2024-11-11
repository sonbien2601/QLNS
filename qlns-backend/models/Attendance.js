// models/Attendance.js
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
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
  dailyHours: {
    type: Number,
    default: 0
  },
  monthlyHours: {
    type: Number,
    default: 0
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

// Index cho tìm kiếm theo tháng và năm
attendanceSchema.index({ userId: 1, month: 1, year: 1, date: 1 });

// Middleware để tự động cập nhật giờ làm việc
attendanceSchema.pre('save', async function (next) {
  try {
    // Validate check-in/out times
    if (this.morningCheckOut && this.morningCheckIn) {
      if (new Date(this.morningCheckOut) < new Date(this.morningCheckIn)) {
        throw new Error('Thời gian check-out buổi sáng không thể trước check-in');
      }
    }

    if (this.afternoonCheckOut && this.afternoonCheckIn) {
      if (new Date(this.afternoonCheckOut) < new Date(this.afternoonCheckIn)) {
        throw new Error('Thời gian check-out buổi chiều không thể trước check-in');
      }
    }

    // Tính toán số giờ làm việc trong ngày
    let dailyMinutes = 0;

    // Xử lý ca sáng
    if (this.morningCheckIn && this.morningCheckOut) {
      const startTime = moment(this.morningCheckIn);
      const endTime = moment(this.morningCheckOut);

      // Giới hạn thời gian làm việc buổi sáng từ 8h đến 12h
      const morningStart = moment(this.morningCheckIn).startOf('day').add(8, 'hours');
      const morningEnd = moment(this.morningCheckIn).startOf('day').add(12, 'hours');

      // Điều chỉnh thời gian check-in/out nếu nằm ngoài khung giờ
      const effectiveStart = startTime.isAfter(morningStart) ? startTime : morningStart;
      const effectiveEnd = endTime.isBefore(morningEnd) ? endTime : morningEnd;

      if (effectiveEnd.isAfter(effectiveStart)) {
        const morningMinutes = effectiveEnd.diff(effectiveStart, 'minutes');
        dailyMinutes += Math.floor(morningMinutes / 15) * 15;
      }
    }

    // Xử lý ca chiều
    if (this.afternoonCheckIn && this.afternoonCheckOut) {
      const startTime = moment(this.afternoonCheckIn);
      const endTime = moment(this.afternoonCheckOut);

      // Giới hạn thời gian làm việc buổi chiều từ 13:30 đến 17:30
      const afternoonStart = moment(this.afternoonCheckIn).startOf('day').add(13, 'hours').add(30, 'minutes');
      const afternoonEnd = moment(this.afternoonCheckIn).startOf('day').add(17, 'hours').add(30, 'minutes');

      // Điều chỉnh thời gian check-in/out nếu nằm ngoài khung giờ
      const effectiveStart = startTime.isAfter(afternoonStart) ? startTime : afternoonStart;
      const effectiveEnd = endTime.isBefore(afternoonEnd) ? endTime : afternoonEnd;

      if (effectiveEnd.isAfter(effectiveStart)) {
        const afternoonMinutes = effectiveEnd.diff(effectiveStart, 'minutes');
        dailyMinutes += Math.floor(afternoonMinutes / 15) * 15;
      }
    }

    // Cập nhật số giờ làm việc trong ngày
    this.dailyHours = parseFloat((dailyMinutes / 60).toFixed(2));

    // Tính tổng giờ làm việc trong tháng
    const monthlyAttendance = await this.constructor.find({
      userId: this.userId,
      month: this.month,
      year: this.year,
      _id: { $ne: this._id }
    });

    const totalMonthlyHours = monthlyAttendance.reduce((sum, record) => {
      return sum + (record.dailyHours || 0);
    }, this.dailyHours);

    this.monthlyHours = parseFloat(totalMonthlyHours.toFixed(2));

    next();
  } catch (error) {
    next(error);
  }
});

// Method định dạng thời gian làm việc
attendanceSchema.methods.getFormattedTimes = function () {
  return {
    dailyHours: `${Math.floor(this.dailyHours)} giờ ${Math.round((this.dailyHours % 1) * 60)} phút`,
    monthlyHours: `${Math.floor(this.monthlyHours)} giờ ${Math.round((this.monthlyHours % 1) * 60)} phút`
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;