const mongoose = require('mongoose');

// Liên kết với User2 model, lưu ID của nhân viên nhận lương
const salarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  basicSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  totalSalary: { type: Number },
  actualWorkHours: { type: Number, default: 0 },
}, { timestamps: true });

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;