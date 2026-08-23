const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    morningCheckIn: Date,
    morningCheckOut: Date,
    afternoonCheckIn: Date,
    afternoonCheckOut: Date,
    dailyMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'leave', 'pending'],
      default: 'pending',
    },
    lateMinutes: { type: Number, default: 0 },
    latePenalty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ user: 1, month: 1, year: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
