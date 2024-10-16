const mongoose = require('mongoose');

const feedbackSalarySchema = new mongoose.Schema({
  // Liên kết với User2 model, lưu ID của nhân viên gửi phản hồi về lương
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  message: { type: String, required: true },
  isFromAdmin: { type: Boolean, default: false }, // Xác định nếu phản hồi từ admin
  createdAt: { type: Date, default: Date.now },
});

const FeedbackSalary = mongoose.model('FeedbackSalary', feedbackSalarySchema);
module.exports = FeedbackSalary;