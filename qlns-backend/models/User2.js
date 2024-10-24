// models/User2.js
const mongoose = require('mongoose');

const user2Schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  position: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  basicSalary: { type: Number, required: true },
  contractStart: { type: Date },
  contractEnd: { type: Date },
  contractType: { type: String },
  contractType: { type: String, enum: ['Toàn thời gian', 'Bán thời gian', 'Tạm thời'] },
  contractStatus: { type: String, enum: ['active', 'inactive', 'expired'] },
  employeeType: { type: String, enum: ['Thử việc', 'Chính thức'], default: 'Thử việc' },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true }
}, { timestamps: true });

const User2 = mongoose.model('User2', user2Schema);
module.exports = User2;