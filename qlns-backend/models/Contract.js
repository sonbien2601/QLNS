const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  // Liên kết với User2 model, lưu ID của nhân viên có hợp đồng
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User2',
    required: true
  },
  contractType: {
    type: String,
    required: true,
    enum: ['Toàn thời gian', 'Bán thời gian', 'Thử việc']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    required: true,
    enum: ['Còn hiệu lực', 'Hết hiệu lực']
  }
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);