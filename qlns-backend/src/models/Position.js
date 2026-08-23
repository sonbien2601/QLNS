const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    level: {
      type: String,
      enum: ['staff', 'senior', 'lead', 'manager', 'director'],
      default: 'staff',
    },
    probationCategory: {
      type: String,
      enum: ['executive', 'professional', 'intermediate', 'simple'],
      default: 'professional',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

positionSchema.index({ name: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Position', positionSchema);
