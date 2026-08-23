const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.5, max: 4 },
    kind: { type: String, enum: ['weekday', 'weekend', 'holiday'], required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    payAmount: { type: Number, default: 0 },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
  },
  { timestamps: true }
);

overtimeSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Overtime', overtimeSchema);
