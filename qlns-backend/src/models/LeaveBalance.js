const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    entitled: { type: Number, required: true },
    used: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ user: 1, year: 1 }, { unique: true });
leaveBalanceSchema.virtual('remaining').get(function remaining() {
  return Math.max(0, this.entitled - this.used);
});
leaveBalanceSchema.set('toJSON', { virtuals: true });
leaveBalanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
