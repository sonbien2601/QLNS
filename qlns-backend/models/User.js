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
  gender: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;


// Giải thích mối quan hệ giữa các bảng:

// 1. User và User2:
//    - User là mô hình cho admin 
//    - User2 là mô hình cho nhân viên, bao gồm thông tin về hợp đồng và lương.

// 2. User2 và các mô hình khác:
//    - Appointment, Attendance, Contract, FeedbackSalary, Resignation, và Salary đều có liên kết đến User2 thông qua userId hoặc employeeId.
//    - Điều này cho phép theo dõi thông tin cụ thể của từng nhân viên trong các lĩnh vực khác nhau của hệ thống.

// 3. Task:
//    - Task liên kết với User (không phải User2) cho cả assignedTo và createdBy.
//    - Điều này cho thấy có thể có sự khác biệt trong cách sử dụng User và User2 trong hệ thống.

// 4. Các mối quan hệ một-nhiều:
//    - Một User2 có thể có nhiều Appointment, Attendance, Contract, FeedbackSalary, Resignation, và Salary records.
//    - Một User có thể tạo nhiều Task và được giao nhiều Task.

// 5. Theo dõi thời gian:
//    - Hầu hết các mô hình đều sử dụng { timestamps: true } để tự động theo dõi thời gian tạo và cập nhật.

// 6. Enum và Validation:
//    - Nhiều mô hình sử dụng enum để giới hạn các giá trị có thể cho một số trường, đảm bảo tính nhất quán của dữ liệu.

// Lưu ý: Có vẻ như có sự chồng chéo giữa User và User2, có thể cần xem xét hợp nhất hoặc làm rõ vai trò của mỗi mô hình trong hệ thống.