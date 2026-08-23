const mongoose = require('mongoose');
const { APPROVAL_TYPES } = require('../config/constants');

const approvalSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(APPROVAL_TYPES), required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    adminResponse: { type: String, default: '' },
  },
  { timestamps: true }
);

approvalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Approval', approvalSchema);
