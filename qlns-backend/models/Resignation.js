const mongoose = require('mongoose');

const ResignationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2'
  }
});

module.exports = mongoose.model('Resignation', ResignationSchema);