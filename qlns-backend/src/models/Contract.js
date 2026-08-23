const mongoose = require('mongoose');
const { CONTRACT_TYPES, CONTRACT_STATUS } = require('../config/constants');

const contractSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contractType: { type: String, enum: Object.values(CONTRACT_TYPES), required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: Object.values(CONTRACT_STATUS), default: CONTRACT_STATUS.ACTIVE },
    signedSalary: { type: Number, required: true },
    note: { type: String, default: '' },
    definiteSequence: { type: Number, default: 1 },
  },
  { timestamps: true }
);

contractSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Contract', contractSchema);
