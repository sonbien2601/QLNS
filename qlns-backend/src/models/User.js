const mongoose = require('mongoose');
const { ROLES, EMPLOYEE_TYPES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true, sparse: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
      index: true,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    position: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
    positionName: { type: String, default: '' },
    employeeType: {
      type: String,
      enum: Object.values(EMPLOYEE_TYPES),
      default: EMPLOYEE_TYPES.PROBATION,
    },
    basicSalary: { type: Number, default: 0, min: 0 },
    insuranceSalary: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    dependents: { type: Number, default: 0, min: 0 },
    hiredAt: { type: Date },
    probationEnd: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    securityAnswers: {
      type: [
        {
          question: { type: String, required: true },
          answerHash: { type: String, required: true },
        },
      ],
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
