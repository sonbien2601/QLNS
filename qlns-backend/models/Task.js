const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  expectedCompletionTime: { type: String },
  // Liên kết với User model, lưu ID của nhân viên được giao nhiệm vụ
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Liên kết với User model, lưu ID của người tạo nhiệm vụ
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);