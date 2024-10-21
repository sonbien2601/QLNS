const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Thêm trường username
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  position: { type: String, required: true },
  companyName: { type: String, required: true },
  city: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;


