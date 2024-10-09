// models/Salary.js
const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  basicSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  totalSalary: { type: Number }, // Tổng thu nhập = lương cơ bản + thưởng
}, { timestamps: true });

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;
