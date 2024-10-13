const mongoose = require('mongoose');

const feedbackSalarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  message: { type: String, required: true },
  isFromAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const FeedbackSalary = mongoose.model('FeedbackSalary', feedbackSalarySchema);
module.exports = FeedbackSalary;