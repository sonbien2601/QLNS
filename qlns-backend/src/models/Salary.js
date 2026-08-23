const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    taskBonus: { type: Number, default: 0 },
    taskPenalty: { type: Number, default: 0 },
    latePenalty: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    standardHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'paid'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

salarySchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);
