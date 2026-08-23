const mongoose = require('mongoose');

const resignationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true },
    lastWorkingDay: { type: Date, required: true },
    noticeDaysRequired: { type: Number, required: true },
    noticeDaysGiven: { type: Number, required: true },
    lawful: { type: Boolean, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    handoverNote: { type: String, default: '' },
    adminResponse: String,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resignation', resignationSchema);
