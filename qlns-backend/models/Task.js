const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  expectedCompletionTime: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'overdue'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  bonus: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  actualPenalty: { type: Number, default: 0 },
  feedback: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);