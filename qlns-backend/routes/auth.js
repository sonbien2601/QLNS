const express = require('express'); // Nhập thư viện Express
const bcrypt = require('bcryptjs'); // Nhập thư viện bcryptjs để mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Nhập thư viện jsonwebtoken để tạo và xác minh JWT
const moment = require('moment-timezone');
const schedule = require('node-schedule');

const User = require('../models/User'); // Nhập mô hình User
const User2 = require('../models/User2'); // Nhập mô hình User2
const Appointment = require('../models/Appointment'); // Nhập mô hình Appointment
const Attendance = require('../models/Attendance'); // Nhập mô hình Attendance
const Salary = require('../models/Salary'); // Nhập mô hình Salary
const Contract = require('../models/Contract'); // Nhập mô hình Contract
const FeedbackSalary = require('../models/FeedbackSalary');
const Task = require('../models/Task');
const Resignation = require('../models/Resignation');

const router = express.Router(); // Tạo router từ Express

// Hàm helper
const getVietnamTime = () => moment().tz('Asia/Ho_Chi_Minh');

const isWorkday = (date) => {
  const day = date.day();
  return day >= 1 && day <= 5;
};

const formatTimeDifference = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} giờ ${minutes} phút`;
};

// Hàm tạo token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' } // Token hết hạn sau 24 giờ
  );
};

// Middleware để kiểm tra token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Lấy token từ header
  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập trước' }); // Nếu không có token, trả về lỗi 401
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); // Xác minh token
    req.user = decoded; // Gắn thông tin người dùng vào request
    next(); // Tiếp tục xử lý request
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' }); // Nếu token không hợp lệ, trả về lỗi 401
  }
};

// Route đăng ký
router.post('/register', async (req, res) => {
  const { username, fullName, email, password, phoneNumber, position, companyName, city, gender } = req.body;

  try {
    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email đã được sử dụng' }); // Nếu email đã tồn tại, trả về lỗi 400
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username đã được sử dụng' }); // Nếu username đã tồn tại, trả về lỗi 400
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Mã hóa mật khẩu
    const role = 'admin'; // Đặt vai trò mặc định là admin

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      position,
      companyName,
      city,
      role,
      gender
    });

    await newUser.save(); // Lưu người dùng mới vào cơ sở dữ liệu
    res.status(201).json({
      message: 'Đăng ký thành công',
      role: newUser.role,
      fullName: newUser.fullName,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký', error: error.message }); // Trả về lỗi 500 nếu có lỗi xảy ra
  }
});

// Route đăng nhập
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    let user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user) {
      user = await User2.findOne({
        $or: [{ email: login }, { username: login }]
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    const token = generateToken(user);

    res.json({
      token,
      userId: user._id,
      role: user.role,
      fullName: user.fullName,
      username: user.username
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
});

// Route tạo tài khoản người dùng từ admin
router.post('/create-user', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  const {
    username,
    fullName,
    email,
    password,
    phoneNumber,
    position,
    basicSalary,
    contractStart,
    contractEnd,
    contractType,
    contractStatus,
    employeeType,
    gender, 
  } = req.body;

  try {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User2({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      position,
      role: 'user',
      basicSalary,
      contractStart,
      contractEnd,
      contractType,
      contractStatus,
      gender,
      employeeType: employeeType || 'thử việc' // Sử dụng giá trị được cung cấp hoặc mặc định
    });

    await newUser.save();

    // Tạo token mới cho admin sau khi thêm nhân viên thành công
    const newToken = generateToken(req.user);

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        position: newUser.position,
        role: newUser.role,
        basicSalary: newUser.basicSalary,
        contractStart: newUser.contractStart,
        contractEnd: newUser.contractEnd,
        contractType: newUser.contractType,
        contractStatus: newUser.contractStatus,
        gender: newUser.gender,
        employeeType: newUser.employeeType
      },
      newToken // Trả về token mới cho admin
    });
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản:', error);
    res.status(500).json({
      message: 'Lỗi khi tạo tài khoản',
      error: error.message
    });
  }
});

// Route làm mới token
router.post('/refresh-token', authenticate, (req, res) => {
  const newToken = generateToken(req.user);
  res.json({ token: newToken });
});

// ================== API YÊU CẦU BỔ NHIỆM ==================

// Route để lấy thông tin người dùng
router.get('/user-info', authenticate, async (req, res) => {
  try {
    let user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      user = await User2.findById(req.user.userId).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    res.json(user);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
  }
});

// Cập nhật route tạo yêu cầu bổ nhiệm
router.post('/appointment-request', authenticate, async (req, res) => {
  const { newPosition, reason } = req.body;

  try {
    let user = await User.findById(req.user.userId);
    if (!user) {
      user = await User2.findById(req.user.userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    const appointment = new Appointment({
      userId: req.user.userId,
      oldPosition: user.position || 'Không có thông tin',
      newPosition,
      reason,
      status: 'pending',
    });

    await appointment.save();

    res.status(201).json({ message: 'Yêu cầu bổ nhiệm đã được gửi', appointment });
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
    const user = await User2.findById(req.user.userId);
    
    const appointmentsWithOldPosition = appointments.map(appointment => ({
      ...appointment.toObject(),
      oldPosition: user.position // Thêm vị trí hiện tại của user vào mỗi appointment
    }));

    res.json({ appointments: appointmentsWithOldPosition });
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

    await Appointment.deleteOne({ _id: req.params.id }); // Xóa yêu cầu bổ nhiệm
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
// Route Check-in
router.post('/attendance/check-in', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = getVietnamTime();
    const today = now.startOf('day').toDate();

    if (!isWorkday(now)) {
      return res.status(400).json({ message: 'Hôm nay không phải ngày làm việc' });
    }

    let attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      attendance = new Attendance({ userId, date: today });
    }

    const morningStart = moment(today).hours(8).minutes(0);
    const morningEnd = moment(today).hours(12).minutes(0);
    const afternoonStart = moment(today).hours(13).minutes(30);
    const afternoonEnd = moment(today).hours(17).minutes(0);

    // Kiểm tra nếu đã quá 60 phút so với giờ bắt đầu
    if (now.isAfter(morningStart.clone().add(60, 'minutes')) && now.isBefore(afternoonStart)) {
      return res.status(400).json({ message: 'Đã quá giờ check-in buổi sáng' });
    }

    if (now.isAfter(afternoonStart.clone().add(60, 'minutes'))) {
      return res.status(400).json({ message: 'Đã quá giờ check-in buổi chiều' });
    }

    if (now.isBefore(morningEnd)) {
      // Check-in buổi sáng
      if (attendance.morningCheckIn) {
        return res.status(400).json({ message: 'Bạn đã check-in buổi sáng rồi' });
      }
      // Nếu check-in trước 8h, ghi nhận là 8h
      attendance.morningCheckIn = now.isBefore(morningStart) ? morningStart.toDate() : now.toDate();
      attendance.status = now.isAfter(morningStart) ? 'late' : 'present';
    } else if (now.isBetween(afternoonStart, afternoonEnd)) {
      // Check-in buổi chiều
      if (attendance.afternoonCheckIn) {
        return res.status(400).json({ message: 'Bạn đã check-in buổi chiều rồi' });
      }
      if (!attendance.morningCheckIn) {
        return res.status(400).json({ message: 'Bạn không thể check-in buổi chiều khi chưa check-in buổi sáng' });
      }
      attendance.afternoonCheckIn = now.toDate();
    } else {
      return res.status(400).json({ message: 'Không trong giờ làm việc' });
    }

    await attendance.save();
    res.status(200).json({ message: 'Check-in thành công', attendance });
  } catch (error) {
    console.error('Lỗi khi check-in:', error);
    res.status(500).json({ message: 'Lỗi server khi check-in', error: error.message });
  }
});

// Route Check-out
router.post('/attendance/check-out', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = getVietnamTime();
    const today = now.startOf('day').toDate();

    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công cho hôm nay' });
    }

    const morningEnd = moment(today).hours(12).minutes(0);
    const afternoonEnd = moment(today).hours(17).minutes(0);

    if (now.isBefore(morningEnd) && attendance.morningCheckIn) {
      attendance.morningCheckOut = now.toDate();
    } else if (now.isAfter(morningEnd)) {
      if (!attendance.morningCheckOut) {
        attendance.morningCheckOut = morningEnd.toDate();
      }
      attendance.afternoonCheckOut = now.isAfter(afternoonEnd) ? afternoonEnd.toDate() : now.toDate();
    }

    // Tính tổng thời gian làm việc
    let totalMilliseconds = 0;
    if (attendance.morningCheckIn && attendance.morningCheckOut) {
      totalMilliseconds += attendance.morningCheckOut - attendance.morningCheckIn;
    }
    if (attendance.afternoonCheckIn && attendance.afternoonCheckOut) {
      totalMilliseconds += attendance.afternoonCheckOut - attendance.afternoonCheckIn;
    }
    attendance.totalHours = formatTimeDifference(totalMilliseconds);

    await attendance.save();
    res.status(200).json({ message: 'Check-out thành công', attendance });
  } catch (error) {
    console.error('Lỗi khi check-out:', error);
    res.status(500).json({ message: 'Lỗi server khi check-out', error: error.message });
  }
});

// API lấy lịch sử chấm công
router.get('/attendance/history', authenticate, async (req, res) => {
  try {
    const history = await Attendance.find({ userId: req.user.userId }).sort({ date: -1 });
    const formattedHistory = history.map(record => ({
      date: record.date,
      checkIn: record.morningCheckIn || record.afternoonCheckIn,
      checkOut: record.afternoonCheckOut || record.morningCheckOut,
      totalHours: record.totalHours
    }));
    res.json({ history: formattedHistory });
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

// ================== API HỢP ĐỒNG ==================

// API để lấy danh sách hợp đồng từ User2
router.get('/contracts', authenticate, async (req, res) => {
  try {
    const users = await User2.find({}, 'fullName position contractType contractStart contractEnd contractStatus');
    
    const currentDate = new Date();

    const contracts = users.map(user => {
      // Kiểm tra nếu hợp đồng hết hạn
      const isExpired = new Date(user.contractEnd) < currentDate;
      const contractStatus = isExpired ? 'Hết hiệu lực' : 'Còn hiệu lực';

      return {
        _id: user._id,
        employeeId: {
          _id: user._id,
          fullName: user.fullName,
          position: user.position
        },
        contractType: user.contractType,
        startDate: user.contractStart,
        endDate: user.contractEnd,
        status: contractStatus
      };
    });

    res.json(contracts);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hợp đồng:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách hợp đồng', error: error.message });
  }
});

// API để cập nhật hợp đồng
router.put('/contracts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractType, startDate, endDate, status } = req.body;

    const updatedUser = await User2.findByIdAndUpdate(
      id,
      {
        contractType,
        contractStart: startDate,
        contractEnd: endDate,
        contractStatus: status === 'Còn hiệu lực' ? 'active' : 'inactive'
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    const updatedContract = {
      _id: updatedUser._id,
      employeeId: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        position: updatedUser.position
      },
      contractType: updatedUser.contractType,
      startDate: updatedUser.contractStart,
      endDate: updatedUser.contractEnd,
      status: updatedUser.contractStatus === 'active' ? 'Còn hiệu lực' : 'Hết hiệu lực'
    };

    res.json(updatedContract);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật hợp đồng', error: error.message });
  }
});

// API để lấy hợp đồng của người dùng
router.get('/user-contract/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User2.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const contract = {
      contractType: user.contractType,
      startDate: user.contractStart,
      endDate: user.contractEnd,
      status: user.contractStatus === 'active' ? 'Còn hiệu lực' : 'Hết hiệu lực'
    };

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// API để xóa hợp đồng
router.delete('/contracts/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const { id } = req.params;
    console.log('ID nhân viên cần xóa hợp đồng:', id);

    const user = await User2.findById(id);

    if (!user) {
      console.log('Không tìm thấy nhân viên với ID:', id);
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    console.log('Thông tin nhân viên trước khi xóa hợp đồng:', user);

    // Xóa hoàn toàn thông tin hợp đồng
    user.contractStart = undefined;
    user.contractEnd = undefined;
    user.contractType = undefined;
    user.contractStatus = undefined;

    await user.save();

    console.log('Thông tin nhân viên sau khi xóa hợp đồng:', user);

    res.json({ message: 'Hợp đồng đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi chi tiết khi xóa hợp đồng:', error);
    res.status(500).json({ message: 'Lỗi khi xóa hợp đồng', error: error.message, stack: error.stack });
  }
});

// ================== API HỒ SƠ ==================
// Route để lấy danh sách user
router.get('/users', authenticate, async (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      // Nếu là admin, lấy thông tin của tất cả user
      users = await User.find().select('-password');
      users = users.concat(await User2.find().select('-password'));
    } else {
      // Nếu không phải admin, lấy thông tin của chính người dùng đang đăng nhập
      const user = await User.findById(req.user.userId).select('-password');
      users = user ? [user] : [];
      if (!user) {
        const user2 = await User2.findById(req.user.userId).select('-password');
        users = user2 ? [user2] : [];
      }
    }

    res.json({ users });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách user:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Cập nhật route cập nhật thông tin người dùng
router.put('/admin/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Kiểm tra vai trò của người dùng
    if (req.user.role === 'admin') {
      // Nếu là admin, cập nhật thông tin của user được chỉ định
      let user = await User.findById(userId);
      let userModel = User;

      if (!user) {
        user = await User2.findById(userId);
        userModel = User2;
      }

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      Object.assign(user, updateData);
      await user.save();

      res.json({ message: 'Cập nhật thông tin người dùng thành công', user });
    } else {
      // Nếu không phải admin, chỉ cập nhật thông tin của người dùng đang đăng nhập
      let user = await User.findById(req.user.userId);
      let userModel = User;

      if (!user) {
        user = await User2.findById(req.user.userId);
        userModel = User2;
      }

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      Object.assign(user, updateData);
      await user.save();

      res.json({ message: 'Cập nhật thông tin người dùng thành công', user });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ================== API LƯƠNG ==================

// API lấy danh sách lương
router.get('/salary', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    console.log('Bắt đầu xử lý yêu cầu lấy dữ liệu lương');
    const salaries = await Salary.find().populate('userId', 'fullName position');
    if (!salaries || salaries.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu lương' });
    }

    const updatedSalaries = await Promise.all(salaries.map(async (salary) => {
      try {
        if (!salary.userId) {
          console.log('Không tìm thấy thông tin người dùng cho lương:', salary);
          return {
            ...salary.toObject(),
            error: 'Không tìm thấy thông tin người dùng'
          };
        }

        const attendanceRecords = await Attendance.find({ userId: salary.userId._id });
        const actualWorkHours = calculateTotalWorkHours(attendanceRecords);
        const standardWorkHours = 176; // 8 giờ * 22 ngày
        const hourlyRate = salary.basicSalary / standardWorkHours;
        const actualSalary = hourlyRate * actualWorkHours + (salary.bonus || 0);

        return {
          ...salary.toObject(),
          fullName: salary.userId.fullName,
          position: salary.userId.position,
          actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
          hourlyRate: parseFloat(hourlyRate.toFixed(2)),
          actualSalary: Math.round(actualSalary),
          standardWorkHours,
        };
      } catch (innerError) {
        console.error(`Lỗi khi tính toán lương cho nhân viên ${salary.userId?._id}:`, innerError);
        return {
          ...salary.toObject(),
          error: `Không thể tính toán lương cho nhân viên này: ${innerError.message}`
        };
      }
    }));

    res.status(200).json({ salaries: updatedSalaries });
  } catch (error) {
    console.error('Lỗi chi tiết khi lấy dữ liệu lương:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy dữ liệu lương', 
      error: error.message,
      stack: error.stack
    });
  }
});

// API cập nhật lương
router.post('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  const { basicSalary, bonus } = req.body;

  try {
    let salary = await Salary.findOne({ userId: req.params.id });
    if (!salary) {
      salary = new Salary({ userId: req.params.id });
    }

    salary.basicSalary = basicSalary;
    salary.bonus = bonus;
    salary.totalSalary = basicSalary + bonus;

    await salary.save();

    res.status(200).json({ message: 'Cập nhật lương thành công', salary });
  } catch (error) {
    console.error('Lỗi khi cập nhật lương:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lương', error: error.message });
  }
});

// API xóa lương
router.delete('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    await Salary.findOneAndDelete({ userId: req.params.id });
    res.status(200).json({ message: 'Xóa lương thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa lương:', error);
    res.status(500).json({ message: 'Lỗi khi xóa lương', error: error.message });
  }
});

//API lấy lương cho người dùng
router.get('/salary/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }

    // Tìm thông tin lương
    let salary = await Salary.findOne({ userId }).populate('userId', 'fullName position');

    if (!salary) {
      // Nếu không tìm thấy thông tin lương, tạo một bản ghi mới với thông tin cơ bản
      const user = await User2.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
      }
      salary = new Salary({
        userId: user._id,
        basicSalary: user.basicSalary || 0,
        bonus: 0,
        totalSalary: user.basicSalary || 0
      });
      await salary.save();
    }

    // Tính toán số giờ làm việc thực tế
    const attendanceRecords = await Attendance.find({ userId });
    const actualWorkHours = calculateTotalWorkHours(attendanceRecords);

    const standardWorkHours = 176; // 8 giờ * 22 ngày
    const hourlyRate = salary.basicSalary / standardWorkHours;
    const actualSalary = hourlyRate * actualWorkHours + (salary.bonus || 0);

    const salaryInfo = {
      ...salary.toObject(),
      actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
      hourlyRate: parseFloat(hourlyRate.toFixed(2)),
      actualSalary: Math.round(actualSalary),
      standardWorkHours
    };
    res.json({ salary: salaryInfo });
  } catch (error) {
    console.error('Error fetching user salary:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin lương', error: error.message });
  }
});

// Gửi feedback lương
router.post('/feedback-salary', authenticate, async (req, res) => {
  try {
    const { message, userId } = req.body;
    const newFeedback = new FeedbackSalary({
      userId: userId || req.user.userId, // Sử dụng userId được cung cấp hoặc ID của người dùng hiện tại
      message,
      isFromAdmin: req.user.role === 'admin'
    });
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback lương đã được gửi', feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi feedback lương', error: error.message });
  }
});

// Lấy danh sách feedback lương
router.get('/feedback-salary/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }
    const feedbacks = await FeedbackSalary.find({ userId }).sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy feedback lương', error: error.message });
  }
});

// ================== API TỔNG QUAN ==================

// Create a new task
router.post('/tasks', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  const { 
    title, 
    description, 
    dueDate, 
    expectedCompletionTime, 
    assignedTo, 
    bonus, 
    penalty,
    priority
  } = req.body;

  try {
    // Kiểm tra các trường bắt buộc
    if (!title || !dueDate || !assignedTo) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Tạo đối tượng Date từ chuỗi ISO
    const dueDateObj = new Date(dueDate);
    
    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({ message: 'Ngày không hợp lệ' });
    }

    const newTask = new Task({
      title,
      description,
      dueDate: dueDateObj,
      expectedCompletionTime,
      assignedTo,
      createdBy: req.user.userId,
      status: 'pending',
      bonus: bonus || 0,
      penalty: penalty || 0,
      priority: priority || 'medium'
    });

    const savedTask = await newTask.save();
    
    await savedTask.populate('assignedTo', 'fullName');
    await savedTask.populate('createdBy', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Công việc đã được thêm thành công',
      task: savedTask
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Lỗi khi thêm công việc', error: error.message });
  }
});

// Get all tasks (for admin)
router.get('/tasks', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    const formattedTasks = tasks.map(task => ({
      ...task.toObject(),
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleString() : null,
      completedAt: task.completedAt ? new Date(task.completedAt).toLocaleString() : null
    }));

    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get tasks for a specific user
router.get('/tasks/:userId', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    const formattedTasks = tasks.map(task => ({
      ...task.toObject(),
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleString() : null,
      completedAt: task.completedAt ? new Date(task.completedAt).toLocaleString() : null
    }));

    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Update task status
router.put('/tasks/:taskId/status', authenticate, async (req, res) => {
  try {
    const { status, feedback, completedDate, completedTime } = req.body;
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }
    
    if (task.assignedTo.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc này' });
    }
    
    task.status = status;
    if (status === 'completed') {
      task.completedAt = completedDate && completedTime 
        ? `${completedDate}T${completedTime}:00` 
        : new Date().toISOString();
    }
    if (feedback) {
      task.feedback = feedback;
    }
    
    await task.save();

    res.json({ message: 'Cập nhật trạng thái công việc thành công', task });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái công việc', error: error.message });
  }
});

router.delete('/tasks/:taskId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa công việc' });
  }

  try {
    const { taskId } = req.params;
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    res.json({ message: 'Công việc đã được xóa thành công', deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Lỗi khi xóa công việc', error: error.message });
  }
});

// Route to update task details (for admin)
router.put('/tasks/:taskId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc' });
  }

  try {
    const { taskId } = req.params;
    const { 
      title, 
      description, 
      dueDate, 
      dueTime, 
      expectedCompletionTime, 
      assignedTo, 
      bonus, 
      penalty, 
      priority, 
      status 
    } = req.body;

    // Tạo đối tượng chứa dữ liệu cần cập nhật
    let updateData = {
      title,
      description,
      dueDate: dueDate && dueTime ? `${dueDate}T${dueTime}:00` : dueDate,
      expectedCompletionTime,
      assignedTo,
      bonus,
      penalty,
      priority,
      status
    };

    // Xóa các trường không có giá trị (undefined) trong updateData
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Cập nhật dữ liệu công việc và trả về kết quả đã cập nhật
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'fullName').populate('createdBy', 'fullName');

    if (!updatedTask) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    res.json({ message: 'Cập nhật công việc thành công', task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật công việc', error: error.message });
  }
});

// Hoàn thành công việc
router.put('/tasks/:taskId/complete', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ message: 'Công việc đã hoàn thành trước đó' });
    }

    task.status = 'completed';
    task.completedAt = new Date();

    // Kiểm tra nếu công việc hoàn thành sau thời hạn thì áp dụng hình phạt
    let penalty = 0;
    if (task.dueDate && new Date(task.completedAt) > new Date(task.dueDate)) {
      penalty = task.penalty || 0;
    }

    await task.save();

    res.json({ 
      message: 'Công việc đã được đánh dấu hoàn thành', 
      task, 
      penalty: penalty > 0 ? penalty : null 
    });
  } catch (error) {
    console.error('Lỗi khi hoàn thành công việc:', error);
    res.status(500).json({ message: 'Lỗi khi hoàn thành công việc', error: error.message });
  }
});

// ================== API NGHỈ VIỆC ==================
// Route để gửi yêu cầu nghỉ việc (cho user)
router.post('/resignation-request', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const newResignation = new Resignation({
      userId: req.user.userId,
      reason,
      status: 'pending'
    });
    await newResignation.save();
    res.status(201).json({ message: 'Yêu cầu nghỉ việc đã được gửi', resignation: newResignation });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi gửi yêu cầu nghỉ việc', error: error.message });
  }
});

// Route để lấy danh sách yêu cầu nghỉ việc (cho admin)
router.get('/resignation-requests', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  try {
    const resignations = await Resignation.find().populate('userId', 'fullName');
    res.json({ resignations });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu cầu nghỉ việc', error: error.message });
  }
});

// Route để cập nhật trạng thái yêu cầu nghỉ việc (cho admin)
router.put('/resignation-requests/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  try {
    const { status, adminResponse } = req.body;
    const resignation = await Resignation.findById(req.params.id).populate('userId');

    if (!resignation) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu nghỉ việc' });
    }

    if (status === 'approved') {
      // Xóa toàn bộ thông tin liên quan đến người dùng
      const userId = resignation.userId._id;

      // Xóa thông tin từ các collection liên quan
      await Promise.all([
        User.findByIdAndDelete(userId),
        User2.findByIdAndDelete(userId),
        Appointment.deleteMany({ userId }),
        Attendance.deleteMany({ userId }),
        Salary.deleteMany({ userId }),
        Contract.deleteMany({ userId }),
        FeedbackSalary.deleteMany({ userId }),
        Task.deleteMany({ assignedTo: userId }),
        Resignation.deleteMany({ userId })
      ]);

      return res.json({ message: 'Yêu cầu nghỉ việc đã được chấp nhận và tài khoản đã bị xóa' });
    } else {
      // Nếu từ chối, chỉ cập nhật trạng thái
      resignation.status = status;
      resignation.adminResponse = adminResponse;
      resignation.processedAt = Date.now();
      await resignation.save();
    }

    res.json({ message: 'Cập nhật trạng thái yêu cầu nghỉ việc thành công', resignation });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái yêu cầu nghỉ việc:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái yêu cầu nghỉ việc', error: error.message });
  }
});

// Route để lấy yêu cầu nghỉ việc của một user cụ thể
router.get('/user-resignation/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }
    const resignations = await Resignation.find({ userId }).sort({ submittedAt: -1 });
    res.json({ resignations });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy yêu cầu nghỉ việc', error: error.message });
  }
});

// Route để xóa yêu cầu nghỉ việc (cho admin)
router.delete('/resignation-requests/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa yêu cầu này' });
  }
  try {
    const resignation = await Resignation.findByIdAndDelete(req.params.id);
    if (!resignation) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu nghỉ việc' });
    }
    res.json({ message: 'Yêu cầu nghỉ việc đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa yêu cầu nghỉ việc', error: error.message });
  }
});

// Route để hủy yêu cầu nghỉ việc (cho user)
router.delete('/user-resignation/:id', authenticate, async (req, res) => {
  try {
    const resignation = await Resignation.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: 'pending'
    });

    if (!resignation) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu nghỉ việc hoặc yêu cầu không thể hủy' });
    }

    await Resignation.deleteOne({ _id: req.params.id });
    res.json({ message: 'Yêu cầu nghỉ việc đã được hủy thành công' });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu nghỉ việc:', error);
    res.status(500).json({ message: 'Lỗi khi hủy yêu cầu nghỉ việc', error: error.message });
  }
});

// Hàm tự động check-out
const autoCheckOut = async () => {
  const now = getVietnamTime();
  const today = now.startOf('day').toDate();

  if (!isWorkday(now)) {
    return;
  }

  const morningEnd = moment(today).hours(12).minutes(0);
  const afternoonEnd = moment(today).hours(17).minutes(0);

  if (now.isSame(morningEnd, 'minute') || now.isSame(afternoonEnd, 'minute')) {
    const attendances = await Attendance.find({
      date: today,
      $or: [
        { morningCheckOut: null, morningCheckIn: { $ne: null } },
        { afternoonCheckOut: null, afternoonCheckIn: { $ne: null } }
      ]
    });

    for (let attendance of attendances) {
      if (now.isSame(morningEnd, 'minute') && !attendance.morningCheckOut) {
        attendance.morningCheckOut = now.toDate();
      } else if (now.isSame(afternoonEnd, 'minute') && !attendance.afternoonCheckOut) {
        attendance.afternoonCheckOut = now.toDate();
      }

      // Tính lại tổng thời gian làm việc
      let totalMilliseconds = 0;
      if (attendance.morningCheckIn && attendance.morningCheckOut) {
        totalMilliseconds += attendance.morningCheckOut - attendance.morningCheckIn;
      }
      if (attendance.afternoonCheckIn && attendance.afternoonCheckOut) {
        totalMilliseconds += attendance.afternoonCheckOut - attendance.afternoonCheckIn;
      }
      attendance.totalHours = formatTimeDifference(totalMilliseconds);

      await attendance.save();
    }
  }
};

// Hàm đánh dấu vắng mặt cho nhân viên không check-in
const markAbsent = async () => {
  const yesterday = getVietnamTime().subtract(1, 'day').startOf('day').toDate();
  
  if (isWorkday(moment(yesterday))) {
    const absentEmployees = await User2.find({
      _id: { $nin: await Attendance.distinct('userId', { date: yesterday }) }
    });

    for (let employee of absentEmployees) {
      const absentRecord = new Attendance({
        userId: employee._id,
        date: yesterday,
        status: 'absent'
      });
      await absentRecord.save();
    }
  }
};

// Hàm liên kết chấm công với công việc
const linkAttendanceWithTasks = async (userId, date) => {
  const tasks = await Task.find({
    assignedTo: userId,
    dueDate: { $gte: date, $lt: moment(date).add(1, 'day').toDate() },
    status: { $in: ['completed', 'overdue'] }
  });

  const attendance = await Attendance.findOne({ userId, date });

  if (attendance && attendance.status === 'present') {
    for (let task of tasks) {
      if (task.status === 'completed' && task.completedAt > task.dueDate) {
        task.actualPenalty = task.penalty;
      } else if (task.status === 'overdue') {
        task.actualPenalty = task.penalty;
      }
      await task.save();
    }
  }
};

// Lên lịch cho các hàm tự động
const scheduleAutoCheckOut = () => {
  const scheduleTimes = ['12:00', '17:00'];
  scheduleTimes.forEach(time => {
    schedule.scheduleJob(time, autoCheckOut);
  });
};

const scheduleMarkAbsent = () => {
  schedule.scheduleJob('0 1 * * *', markAbsent);  // Chạy lúc 1 giờ sáng mỗi ngày
};

const scheduleLinkAttendanceWithTasks = () => {
  schedule.scheduleJob('0 2 * * *', async () => {  // Chạy lúc 2 giờ sáng mỗi ngày
    const yesterday = getVietnamTime().subtract(1, 'day').startOf('day').toDate();
    const attendances = await Attendance.find({ date: yesterday });
    for (let attendance of attendances) {
      await linkAttendanceWithTasks(attendance.userId, attendance.date);
    }
  });
};

// Khởi tạo các lịch tự động
scheduleAutoCheckOut();
scheduleMarkAbsent();
scheduleLinkAttendanceWithTasks();

module.exports = router;