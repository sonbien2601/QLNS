const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User2', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  workingDays: { type: Number, default: 0 },
  actualWorkHours: { type: Number, default: 0 },
  standardWorkHours: { type: Number, default: 0 },
  taskBonus: { type: Number, default: 0 },
  taskPenalty: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalSalary: { type: Number, default: 0 },
  
  // Phạt đi muộn theo tháng
  monthlyLateData: {
    latePenalty: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    lateDetails: [{
      date: Date,
      minutes: Number,
      penalty: Number
    }]
  },

  attendanceDetails: [{
    date: { type: Date },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'pending'],
      default: 'pending'
    },
    morningAttendance: {
      checkIn: Date,
      checkOut: Date, 
      hours: Number,
      isLate: Boolean,
      latePenalty: Number
    },
    afternoonAttendance: {
      checkIn: Date,
      checkOut: Date,
      hours: Number,
      isLate: Boolean,
      latePenalty: Number
    },
    dailyHours: Number,
    note: String
  }],
  
  attendanceSummary: {
    totalDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    totalWorkHours: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Xóa index cũ và tạo index mới
salarySchema.clearIndexes();
salarySchema.index({ userId: 1, month: 1, year: 1 });

// Method để thêm thông tin đi muộn
salarySchema.methods.addLateRecord = function(date, minutes, penalty) {
  if (!this.monthlyLateData) {
    this.monthlyLateData = {
      latePenalty: 0,
      lateCount: 0,
      lateDetails: []
    };
  }
  
  this.monthlyLateData.lateDetails.push({
    date: date,
    minutes: minutes,
    penalty: penalty
  });
  
  this.monthlyLateData.lateCount = this.monthlyLateData.lateDetails.length;
  this.monthlyLateData.latePenalty = this.monthlyLateData.lateDetails.reduce(
    (total, detail) => total + detail.penalty, 
    0
  );
};

// Method tính lương cuối cùng 
salarySchema.methods.calculateFinalSalary = function() {
  try {
    this.standardWorkHours = this.workingDays * 8;
    
    if (this.standardWorkHours === 0) {
      throw new Error('Số giờ làm việc tiêu chuẩn không thể bằng 0');
    }

    const hourlyRate = this.basicSalary / this.standardWorkHours;
    const actualSalary = hourlyRate * (this.actualWorkHours || 0);
    
    const totalBonus = (this.bonus || 0) + (this.taskBonus || 0);
    const totalPenalty = (this.taskPenalty || 0) + 
      (this.monthlyLateData?.latePenalty || 0);

    this.totalSalary = Math.max(0, actualSalary + totalBonus - totalPenalty);
    
    return this.totalSalary;
  } catch (error) {
    console.error('Error calculating salary:', error);
    return 0;
  }
};

// Các methods khác giữ nguyên
salarySchema.methods.calculateWorkingDays = function() {
  try {
    const startDate = new Date(this.year, this.month - 1, 1);
    const endDate = new Date(this.year, this.month, 0);
    let workingDays = 0;
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    this.workingDays = workingDays;
    this.standardWorkHours = workingDays * 8;
    
    return workingDays;
  } catch (error) {
    console.error('Error calculating working days:', error);
    return 0;
  }
};

salarySchema.virtual('workRatio').get(function() {
  if (!this.standardWorkHours) return 0;
  return ((this.actualWorkHours / this.standardWorkHours) * 100).toFixed(2);
});

// Middleware tự động tính toán trước khi lưu
salarySchema.pre('save', async function(next) {
  try {
    // Đảm bảo có dữ liệu đi muộn theo tháng
    if (!this.monthlyLateData) {
      this.monthlyLateData = {
        latePenalty: 0,
        lateCount: 0,
        lateDetails: []
      };
    }

    if (!this.workingDays) {
      this.calculateWorkingDays();
    }
    
    // Cập nhật tổng phạt đi muộn
    if (this.monthlyLateData.lateDetails && this.monthlyLateData.lateDetails.length > 0) {
      this.monthlyLateData.latePenalty = this.monthlyLateData.lateDetails.reduce(
        (total, detail) => total + detail.penalty, 
        0
      );
      this.monthlyLateData.lateCount = this.monthlyLateData.lateDetails.length;
    }

    this.calculateFinalSalary();
    next();
  } catch (error) {
    next(error);
  }
});

// Thêm method để lấy dữ liệu đi muộn của tháng
salarySchema.methods.getLateData = function() {
  return {
    latePenalty: this.monthlyLateData?.latePenalty || 0,
    lateCount: this.monthlyLateData?.lateCount || 0,
    lateDetails: this.monthlyLateData?.lateDetails || []
  };
};

const Salary = mongoose.model('Salary', salarySchema);
module.exports = Salary;