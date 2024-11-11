// models/Dismissal.js
const mongoose = require('mongoose');

const dismissalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  oldPosition: {
    type: String,
    required: true
  },
  newPosition: {
    type: String, 
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dismissal', dismissalSchema);