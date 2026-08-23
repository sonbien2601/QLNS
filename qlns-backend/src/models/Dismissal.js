const mongoose = require('mongoose');

const dismissalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    oldPositionName: { type: String, required: true },
    newPositionName: { type: String, required: true },
    reason: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    adminResponse: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dismissal', dismissalSchema);
