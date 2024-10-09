const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const User2 = require('../models/User2');
const Appointment = require('../models/Appointment');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const mongoose = require('mongoose');
const router = express.Router();
const nodemailer = require('nodemailer');

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware để kiểm tra token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập trước' });
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Route đăng ký
router.post('/register', async (req, res) => {
  const { username, fullName, email, password, phoneNumber, position, companyName, city, staffSize } = req.body;

  try {
    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username đã được sử dụng' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'admin';

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      position,
      companyName,
      city,
      staffSize,
      role,
    });

    await newUser.save();
    res.status(201).json({
      message: 'Đăng ký thành công',
      role: newUser.role,
      fullName: newUser.fullName,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký', error: error.message });
  }
});

// Route đăng nhập
router.post('/login', async (req, res) => {
  const { login, password } = req.body; // login có thể là email hoặc username

  try {
    // Tìm user với email hoặc username
    let user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user) {
      user = await User2.findOne({
        $or: [{ email: login }, { username: login }]
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Tài khoản không tồn tại' });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      'your_jwt_secret', 
      { expiresIn: '1h' }
    );
    
    return res.json({
      token,
      role: user.role,
      fullName: user.fullName,
      username: user.username
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error });
  }
});


// Route tạo tài khoản người dùng từ admin
router.post('/create-user', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  const { username, fullName, email, password, phoneNumber, position } = req.body;

  try {
    // Kiểm tra username và email đã tồn tại chưa trong cả User và User2
    const existingUserInUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    const existingUserInUser2 = await User2.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUserInUser || existingUserInUser2) {
      if ((existingUserInUser?.email === email) || (existingUserInUser2?.email === email)) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      if ((existingUserInUser?.username === username) || (existingUserInUser2?.username === username)) {
        return res.status(400).json({ message: 'Username đã được sử dụng' });
      }
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới với role là 'user'
    const newUser = new User2({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      position,
      role: 'user'
    });

    await newUser.save();

    // Trả về thông tin user đã tạo (không bao gồm password)
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      position: newUser.position,
      role: newUser.role
    };

    return res.status(201).json({
      message: 'Tạo tài khoản thành công',
      user: userResponse
    });

  } catch (error) {
    console.error('Lỗi khi tạo tài khoản:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi tạo tài khoản',
      error: error.message 
    });
  }
});

// Route để tạo yêu cầu bổ nhiệm
router.post('/appointment-request', authenticate, async (req, res) => {
  const { oldPosition, newPosition, reason } = req.body;

  try {
    // Tạo yêu cầu bổ nhiệm mới
    const appointment = new Appointment({
      userId: req.user.userId,  // Lấy ID của người dùng hiện tại
      oldPosition,
      newPosition,
      reason,  // Lưu lý do bổ nhiệm
      status: 'pending',  // Mặc định trạng thái là 'pending'
    });

    await appointment.save();  // Lưu vào cơ sở dữ liệu

    res.status(201).json({ message: 'Yêu cầu bổ nhiệm đã được gửi' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi yêu cầu bổ nhiệm', error: error.message });
  }
});

// Lấy danh sách bổ nhiệm của user
router.get('/user-appointments', authenticate, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const appointments = await Appointment.find({ userId: req.user.userId });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bổ nhiệm', error: error.message });
  }
});


// Lấy danh sách bổ nhiệm cho admin
router.get('/get-appointments', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const appointments = await Appointment.find().populate('userId', 'fullName');
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bổ nhiệm', error: error.message });
  }
});

// Phê duyệt bổ nhiệm
router.put('/approve-appointment/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền phê duyệt' });
  }

  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, 
      { 
        status: 'approved', 
        approvedAt: Date.now() // Cập nhật thời gian phê duyệt
      }, 
      { new: true }
    );
    
    res.json({ message: 'Yêu cầu bổ nhiệm đã được phê duyệt', appointment });
    
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi phê duyệt bổ nhiệm', error: error.message });
  }
});


// Từ chối bổ nhiệm
router.put('/reject-appointment/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền từ chối' });
  }

  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, 
      { 
        status: 'rejected', 
        rejectedAt: Date.now() // Cập nhật thời gian từ chối
      }, 
      { new: true }
    );

    res.json({ message: 'Yêu cầu bổ nhiệm đã bị từ chối', appointment });
    
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi từ chối bổ nhiệm', error: error.message });
  }
});

// Lấy danh sách bổ nhiệm cho admin
router.get('/get-appointments', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const appointments = await Appointment.find().populate('userId', 'fullName');  // Dùng populate để lấy thông tin user
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bổ nhiệm', error: error.message });
  }
});


// Hủy yêu cầu bổ nhiệm của user
router.delete('/cancel-appointment/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Bạn không có quyền hủy yêu cầu này' });
  }

  try {
    // Chỉ cho phép hủy các yêu cầu ở trạng thái 'pending'
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.user.userId, status: 'pending' });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu để hủy hoặc yêu cầu không ở trạng thái chờ duyệt' });
    }

    await appointment.remove();  // Xóa yêu cầu bổ nhiệm
    res.json({ message: 'Yêu cầu bổ nhiệm đã được hủy' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi hủy yêu cầu bổ nhiệm', error: error.message });
  }
});

// Xóa yêu cầu bổ nhiệm (Cập nhật trạng thái thành "rejected")
router.delete('/delete-appointment/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa yêu cầu này' });
  }

  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu bổ nhiệm để xóa' });
    }

    // Sử dụng deleteOne() thay vì remove()
    await Appointment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Yêu cầu bổ nhiệm đã được xóa thành công' });
    
  } catch (error) {
    console.error('Lỗi xóa bổ nhiệm:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xóa yêu cầu bổ nhiệm', 
      error: error.message 
    });
  }
});


// ================== API CHẤM CÔNG ==================
// Hàm helper để định dạng thời gian (đặt ở đầu file hoặc trong một file riêng)
const formatTimeDifference = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let result = [];
  if (hours > 0) result.push(`${hours} giờ`);
  if (minutes > 0) result.push(`${minutes} phút`);
  if (remainingSeconds > 0 || result.length === 0) result.push(`${remainingSeconds} giây`);
  
  return result.join(' ');
};

// Route Check-in
router.post('/attendance/check-in', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      userId: req.user.userId,
      checkIn: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Bạn đã check-in hôm nay rồi!' });
    }

    const newAttendance = new Attendance({
      userId: req.user.userId,
      checkIn: new Date(),
    });
    await newAttendance.save();
    res.status(201).json({ message: 'Check-in thành công', attendance: newAttendance });
  } catch (error) {
    console.error('Lỗi khi check-in:', error);
    res.status(500).json({ message: 'Lỗi khi check-in', error: error.message });
  }
});

// Route Check-out
router.post('/attendance/check-out', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user.userId,
      checkIn: { $gte: today },
      checkOut: null
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi check-in cho hôm nay' });
    }

    attendance.checkOut = new Date();
    const timeDifference = attendance.checkOut - attendance.checkIn;
    attendance.totalHours = formatTimeDifference(timeDifference);

    await attendance.save();

    res.json({ 
      message: 'Check-out thành công', 
      attendance: {
        _id: attendance._id,
        userId: attendance.userId,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours
      }
    });
  } catch (error) {
    console.error('Lỗi khi check-out:', error);
    res.status(500).json({ message: 'Lỗi server khi check-out', error: error.message });
  }
});

// API lấy lịch sử chấm công
router.get('/attendance/history', authenticate, async (req, res) => {
  try {
    const history = await Attendance.find({ userId: req.user.userId }).sort({ checkIn: -1 });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử chấm công', error: error.message });
  }
});
// Route để lấy tất cả bản ghi chấm công cho admin
router.get('/attendance/all', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const attendanceRecords = await Attendance.find()
      .populate('userId', 'fullName position'); // Lấy tên và chức vụ nhân viên
    res.json({ attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu chấm công', error: error.message });
  }
});

// Route để lấy tổng hợp chấm công cho admin
router.get('/attendance/summary', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const attendanceRecords = await Attendance.find()
      .populate('userId', 'fullName position')
      .sort({ checkIn: -1 });
    
    console.log('Số lượng bản ghi chấm công:', attendanceRecords.length);
    
    const validRecords = attendanceRecords.filter(record => record.userId != null).map(record => {
      let totalHours = record.totalHours;
      if (record.checkOut && !totalHours) {
        const timeDifference = record.checkOut - record.checkIn;
        totalHours = formatTimeDifference(timeDifference);
      }
      return {
        _id: record._id,
        userId: {
          fullName: record.userId.fullName,
          position: record.userId.position
        },
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        totalHours: totalHours || 'Chưa check-out'
      };
    });
    
    console.log('Số lượng bản ghi hợp lệ:', validRecords.length);
    
    res.json({ attendanceRecords: validRecords });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu chấm công:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu chấm công', error: error.message });
  }
});




// ================== API LƯƠNG ==================

// Route để tạo hoặc cập nhật lương nhân viên
router.post('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  const { basicSalary, bonus } = req.body;

  try {
    const totalSalary = basicSalary + bonus;

    const salaryData = {
      userId: req.params.id,
      basicSalary,
      bonus,
      totalSalary,
    };

    const existingSalary = await Salary.findOneAndUpdate(
      { userId: req.params.id },
      salaryData,
      { new: true, upsert: true } // Tạo mới nếu không tìm thấy
    );

    res.status(200).json({ message: 'Cập nhật lương thành công', salary: existingSalary });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật lương', error: error.message });
  }
});

// Route để lấy lương của nhân viên
router.get('/salary/:id', authenticate, async (req, res) => {
  try {
    const salary = await Salary.findOne({ userId: req.params.id }).populate('userId', 'fullName position');
    if (!salary) {
      return res.status(404).json({ message: 'Không tìm thấy lương cho nhân viên này' });
    }
    res.json({ salary });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lương', error: error.message });
  }
});

// Route để lấy tất cả lương của nhân viên cho admin
router.get('/salary', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const salaries = await Salary.find().populate('userId', 'fullName position');
    res.json({ salaries });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lương', error: error.message });
  }
});

// Route để xóa lương của nhân viên
router.delete('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    await Salary.findOneAndDelete({ userId: req.params.id });
    res.status(200).json({ message: 'Xóa lương thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa lương', error: error.message });
  }
});



module.exports = router;
