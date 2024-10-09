const mongoose = require('mongoose');

const user2Schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Thêm trường username
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  position: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const User2 = mongoose.model('User2', user2Schema); // Tạo bảng User2
module.exports = User2;
