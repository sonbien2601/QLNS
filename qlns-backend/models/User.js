const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  companyName: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
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

const User = mongoose.model('User', userSchema);
module.exports = User;