// models/Salary.js
const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  month: { type: Number, required: true }, // Tháng của kỳ lương
  year: { type: Number, required: true }, // Năm của kỳ lương
  basicSalary: { type: Number, required: true }, // Lương cơ bản theo tháng
  bonus: { type: Number, default: 0 }, // Thưởng cơ bản
  workingDays: { type: Number, default: 0 }, // Số ngày làm việc trong tháng
  actualWorkHours: { type: Number, default: 0 }, // Số giờ làm việc thực tế
  standardWorkHours: { type: Number, default: 0 }, // Số giờ làm việc chuẩn của tháng
  taskBonus: { type: Number, default: 0 }, // Tổng thưởng từ các task hoàn thành đúng hạn
  taskPenalty: { type: Number, default: 0 }, // Tổng phạt từ các task trễ deadline
  completedTasks: { type: Number, default: 0 }, // Số task hoàn thành
  totalSalary: { type: Number, default: 0 }, // Tổng lương thực nhận
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Tạo index cho việc tìm kiếm theo tháng/năm
salarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Hàm tính toán lương cuối cùng
salarySchema.methods.calculateFinalSalary = function() {
  // Tính số giờ làm việc tiêu chuẩn trong tháng (8 giờ × số ngày làm việc)
  this.standardWorkHours = this.workingDays * 8;
  
  // Tính lương theo số giờ làm việc thực tế
  const hourlyRate = this.basicSalary / this.standardWorkHours;
  const actualSalary = hourlyRate * this.actualWorkHours;
  
  // Tính tổng lương bao gồm các khoản thưởng/phạt
  this.totalSalary = actualSalary + this.bonus + this.taskBonus - this.taskPenalty;
  
  return this.totalSalary;
};

// Hàm tính số ngày làm việc trong tháng (không tính T7, CN)
salarySchema.methods.calculateWorkingDays = function() {
  const date = new Date(this.year, this.month - 1, 1);
  let workingDays = 0;
  
  while (date.getMonth() === this.month - 1) {
    // 0 = CN, 6 = T7
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  this.workingDays = workingDays;
  return workingDays;
};

// Virtual field cho tỷ lệ làm việc
salarySchema.virtual('workRatio').get(function() {
  if (!this.standardWorkHours) return 0;
  return (this.actualWorkHours / this.standardWorkHours * 100).toFixed(2);
});

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;
