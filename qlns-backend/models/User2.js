const mongoose = require('mongoose');

const user2Schema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  basicSalary: { 
    type: Number, 
    required: true 
  },
  contractStart: { 
    type: Date,
    default: null
  },
  contractEnd: { 
    type: Date,
    default: null
  },
  contractType: { 
    type: String, 
    enum: ['Toàn thời gian', 'Bán thời gian', 'Tạm thời', 'Chưa ký hợp đồng'],
    default: 'Chưa ký hợp đồng'
  },
  contractStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  employeeType: { 
    type: String, 
    enum: ['Thử việc', 'Chính thức'], 
    default: 'Thử việc' 
  },
  gender: { 
    type: String, 
    enum: ['Nam', 'Nữ', 'Khác'], 
    required: true 
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Thêm các trường cho câu hỏi bảo mật
  securityQuestion1: {
    type: String,
    required: true
  },
  securityAnswer1: {
    type: String,
    required: true
  },
  securityQuestion2: {
    type: String,
    required: true
  },
  securityAnswer2: {
    type: String,
    required: true
  },
  securityQuestion3: {
    type: String,
    required: true
  },
  securityAnswer3: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

// Virtual field để tính trạng thái hợp đồng cho frontend
user2Schema.virtual('contractDisplayStatus').get(function() {
  if (!this.contractType || this.contractType === 'Chưa ký hợp đồng') {
    return 'Chưa ký hợp đồng';
  }
  
  const currentDate = new Date();
  if (this.contractEnd && this.contractEnd < currentDate) {
    return 'Hết hiệu lực';
  }
  
  return 'Còn hiệu lực';
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
user2Schema.set('toJSON', { virtuals: true });
user2Schema.set('toObject', { virtuals: true });

const User2 = mongoose.model('User2', user2Schema);
module.exports = User2;