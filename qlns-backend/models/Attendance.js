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
attendanceSchema.pre('save', async function(next) {
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

    if (this.morningCheckIn && this.morningCheckOut) {
      const morningDiff = moment(this.morningCheckOut).diff(moment(this.morningCheckIn), 'minutes');
      dailyMinutes += Math.max(0, morningDiff);
    }

    if (this.afternoonCheckIn && this.afternoonCheckOut) {
      const afternoonDiff = moment(this.afternoonCheckOut).diff(moment(this.afternoonCheckIn), 'minutes');
      dailyMinutes += Math.max(0, afternoonDiff);
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
attendanceSchema.methods.getFormattedTimes = function() {
  return {
    dailyHours: `${Math.floor(this.dailyHours)} giờ ${Math.round((this.dailyHours % 1) * 60)} phút`,
    monthlyHours: `${Math.floor(this.monthlyHours)} giờ ${Math.round((this.monthlyHours % 1) * 60)} phút`
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;