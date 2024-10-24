const express = require('express'); // Nhập thư viện Express
const bcrypt = require('bcryptjs'); // Nhập thư viện bcryptjs để mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Nhập thư viện jsonwebtoken để tạo và xác minh JWT
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
const moment = require('moment-timezone');
const schedule = require('node-schedule');


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
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập trước' });
    }

    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    // Tạo token mới để gia hạn thời gian sử dụng
    const newToken = generateToken(decoded);

    // Thêm token mới vào response header
    res.setHeader('New-Token', newToken);

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
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

  try {
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
      gender
    } = req.body;

    // Kiểm tra các giá trị enum
    const validGenders = ['Nam', 'Nữ', 'Khác'];
    const validContractTypes = ['Toàn thời gian', 'Bán thời gian', 'Tạm thời'];
    const validEmployeeTypes = ['Thử việc', 'Chính thức'];
    const validContractStatuses = ['active', 'inactive', 'expired'];

    // Validate dữ liệu đầu vào
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
    }

    if (contractType && !validContractTypes.includes(contractType)) {
      return res.status(400).json({ message: 'Loại hợp đồng không hợp lệ' });
    }

    if (!validEmployeeTypes.includes(employeeType)) {
      return res.status(400).json({ message: 'Loại nhân viên không hợp lệ' });
    }

    if (contractStatus && !validContractStatuses.includes(contractStatus)) {
      return res.status(400).json({ message: 'Trạng thái hợp đồng không hợp lệ' });
    }

    // Kiểm tra user đã tồn tại
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

    // Xây dựng đối tượng user mới
    const userData = {
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      position,
      role: 'user',
      basicSalary: Number(basicSalary),
      gender,
      employeeType: employeeType || 'Thử việc'
    };

    // Chỉ thêm thông tin hợp đồng nếu là nhân viên chính thức
    if (employeeType === 'Chính thức') {
      if (!contractType || !contractStart || !contractEnd) {
        return res.status(400).json({
          message: 'Vui lòng cung cấp đầy đủ thông tin hợp đồng cho nhân viên chính thức'
        });
      }

      userData.contractType = contractType;
      userData.contractStart = new Date(contractStart);
      userData.contractEnd = new Date(contractEnd);
      userData.contractStatus = contractStatus || 'active';

      // Kiểm tra ngày hợp đồng
      if (userData.contractEnd <= userData.contractStart) {
        return res.status(400).json({
          message: 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu'
        });
      }
    }

    const newUser = new User2(userData);
    await newUser.save();

    // Tạo token mới cho admin
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
      newToken
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
// ================== ATTENDANCE HELPER FUNCTIONS ==================

// Unified time constants
const TIME_CONSTANTS = {
  WORKING_HOURS: {
    MORNING: {
      START: 8 * 60,      // 8:00
      END: 12 * 60,       // 12:00
      BUFFER: 15          // 15 phút buffer
    },
    AFTERNOON: {
      START: 13 * 60 + 30, // 13:30
      END: 17 * 60 + 30,   // 17:30
      BUFFER: 15           // 15 phút buffer
    }
  }
};

// Format time from Date to HH:mm:ss
const formatTimeResponse = (time) => {
  if (!time) return null;
  return moment(time).format('HH:mm:ss');
};

// Check if current time is in working period
const checkWorkingPeriod = (now) => {
  const currentTime = now.hour() * 60 + now.minute();
  const { MORNING, AFTERNOON } = TIME_CONSTANTS.WORKING_HOURS;

  if (currentTime >= MORNING.START && currentTime <= MORNING.END) {
    return 'morning';
  } else if (currentTime >= AFTERNOON.START && currentTime <= AFTERNOON.END) {
    return 'afternoon';
  }
  return null;
};

// Calculate working time between check-in and check-out
const calculateWorkingTime = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = moment(checkIn);
  const end = moment(checkOut);
  return Math.max(0, end.diff(start, 'minutes'));
};

// Cập nhật hàm calculateDailyWorkingTime để thêm xử lý bonus/penalty từ tasks
const calculateDailyWorkingTime = async (attendance, userId) => {
  // Tính toán thời gian làm việc như cũ
  const morningMinutes = attendance.morningCheckIn && attendance.morningCheckOut ? 
    calculateWorkingTime(attendance.morningCheckIn, attendance.morningCheckOut) : 0;

  const afternoonMinutes = attendance.afternoonCheckIn && attendance.afternoonCheckOut ?
    calculateWorkingTime(attendance.afternoonCheckIn, attendance.afternoonCheckOut) : 0;

  const totalMinutes = morningMinutes + afternoonMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Lấy thông tin tasks đã hoàn thành của user
  const completedTasks = await Task.find({
    assignedTo: userId,
    status: 'completed'
  });

  // Tính toán tổng bonus và penalty từ tasks
  let totalBonus = 0;
  let totalPenalty = 0;

  completedTasks.forEach(task => {
    const completedDate = new Date(task.completedAt);
    const dueDate = new Date(task.dueDate);

    if (completedDate <= dueDate) {
      // Nếu hoàn thành đúng hoặc trước hạn, cộng bonus
      totalBonus += task.bonus || 0;
    } else {
      // Nếu trễ deadline, trừ penalty
      totalPenalty += task.penalty || 0;
    }
  });

  return {
    morningHours: morningMinutes ? `${Math.floor(morningMinutes / 60)} giờ ${morningMinutes % 60} phút` : null,
    afternoonHours: afternoonMinutes ? `${Math.floor(afternoonMinutes / 60)} giờ ${afternoonMinutes % 60} phút` : null,
    totalTime: totalMinutes > 0 ? `${hours} giờ ${minutes} phút` : '0 giờ 0 phút',
    totalMinutes: totalMinutes,
    taskBonus: totalBonus,
    taskPenalty: totalPenalty,
    details: {
      morning: {
        minutes: morningMinutes,
        formatted: morningMinutes ? `${Math.floor(morningMinutes / 60)} giờ ${morningMinutes % 60} phút` : null
      },
      afternoon: {
        minutes: afternoonMinutes,
        formatted: afternoonMinutes ? `${Math.floor(afternoonMinutes / 60)} giờ ${afternoonMinutes % 60} phút` : null
      }
    }
  };
};

// Logging middleware
const attendanceLogger = (req, res, next) => {
  const start = Date.now();
  const oldJson = res.json;

  res.json = function (data) {
    const responseTime = Date.now() - start;
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    console.log('Request body:', req.body);
    console.log('Response:', data);

    oldJson.call(this, data);
  };

  next();
};

// Apply logging middleware to all attendance routes
router.use('/attendance', attendanceLogger);

// ================== ATTENDANCE APIS ==================

// Check-in API
router.post('/attendance/check-in', authenticate, async (req, res) => {
  try {
    console.log('Starting check-in process...');
    const userId = req.user.userId;
    const user = await User2.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    const now = moment().tz('Asia/Ho_Chi_Minh');
    const today = now.clone().startOf('day');
    console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'));

    // Validate workday
    if (now.day() === 0 || now.day() === 6) {
      return res.status(400).json({ message: 'Hôm nay không phải ngày làm việc' });
    }

    // Validate working period
    const period = checkWorkingPeriod(now);
    if (!period) {
      return res.status(400).json({
        message: 'Ngoài giờ làm việc, không thể check-in',
        detail: `Giờ hiện tại: ${now.format('HH:mm')}`
      });
    }

    // Find or create attendance record
    let attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today.toDate(),
        $lt: today.clone().add(1, 'day').toDate()
      }
    });

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: today.toDate(),
        status: 'pending'
      });
    }

    // Handle check-in based on period
    if (period === 'morning') {
      if (attendance.morningCheckIn) {
        return res.status(400).json({ message: 'Bạn đã check-in buổi sáng rồi' });
      }
      attendance.morningCheckIn = now.toDate();
      attendance.status = now.hour() > 8 || (now.hour() === 8 && now.minute() > 15)
        ? 'late'
        : 'present';
    } else {
      if (attendance.afternoonCheckIn) {
        return res.status(400).json({ message: 'Bạn đã check-in buổi chiều rồi' });
      }
      attendance.afternoonCheckIn = now.toDate();
      // Update status only if not already late from morning
      if (attendance.status !== 'late') {
        attendance.status = now.hour() > 13 || (now.hour() === 13 && now.minute() > 45)
          ? 'late'
          : 'present';
      }
    }

    const workingTime = calculateDailyWorkingTime(attendance);
    attendance.totalHours = workingTime.totalTime;
    await attendance.save();

    res.status(200).json({
      message: 'Check-in thành công',
      attendance: {
        date: now.format('YYYY-MM-DD'),
        morningSession: {
          checkIn: formatTimeResponse(attendance.morningCheckIn),
          checkOut: formatTimeResponse(attendance.morningCheckOut),
          duration: workingTime.morningHours
        },
        afternoonSession: {
          checkIn: formatTimeResponse(attendance.afternoonCheckIn),
          checkOut: formatTimeResponse(attendance.afternoonCheckOut),
          duration: workingTime.afternoonHours
        },
        workingHours: {
          morning: workingTime.morningHours,
          afternoon: workingTime.afternoonHours,
          total: workingTime.totalTime
        },
        status: attendance.status
      }
    });
  } catch (error) {

    console.error('Check-in error:', error);
    res.status(500).json({
      message: 'Lỗi server khi check-in',
      error: {
        message: error.message,
        code: error.code,
        type: error.name
      }
    });
  }
});

// Check-out API with manual checkout only
router.post('/attendance/check-out', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const currentTime = now.hour() * 60 + now.minute();
    const { MORNING, AFTERNOON } = TIME_CONSTANTS.WORKING_HOURS;

    // Validate checkout time
    const isInMorningWindow = currentTime >= MORNING.START &&
      currentTime <= MORNING.END + MORNING.BUFFER;
    const isInAfternoonWindow = currentTime >= AFTERNOON.START &&
      currentTime <= AFTERNOON.END + AFTERNOON.BUFFER;

    if (!isInMorningWindow && !isInAfternoonWindow) {
      return res.status(400).json({
        message: 'Chỉ có thể check-out trong giờ làm việc hoặc trong vòng 15 phút sau mỗi ca',
        detail: `Giờ hiện tại: ${now.format('HH:mm')}`
      });
    }

    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: now.clone().startOf('day').toDate(),
        $lt: now.clone().endOf('day').toDate()
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công cho hôm nay' });
    }

    // Handle morning checkout
    if (isInMorningWindow) {
      if (!attendance.morningCheckIn) {
        return res.status(400).json({ message: 'Bạn chưa check-in buổi sáng' });
      }
      if (attendance.morningCheckOut) {
        return res.status(400).json({ message: 'Bạn đã check-out buổi sáng rồi' });
      }
      attendance.morningCheckOut = now.toDate();
    }
    // Handle afternoon checkout
    else {
      if (!attendance.afternoonCheckIn) {
        return res.status(400).json({ message: 'Bạn chưa check-in buổi chiều' });
      }
      if (attendance.afternoonCheckOut) {
        return res.status(400).json({ message: 'Bạn đã check-out buổi chiều rồi' });
      }
      attendance.afternoonCheckOut = now.toDate();
    }

    const workingTime = calculateDailyWorkingTime(attendance);
    attendance.totalHours = workingTime.totalTime;
    await attendance.save();

    res.status(200).json({
      message: 'Check-out thành công',
      attendance: {
        date: now.format('YYYY-MM-DD'),
        morningSession: {
          checkIn: formatTimeResponse(attendance.morningCheckIn),
          checkOut: formatTimeResponse(attendance.morningCheckOut),
          duration: workingTime.morningHours
        },
        afternoonSession: {
          checkIn: formatTimeResponse(attendance.afternoonCheckIn),
          checkOut: formatTimeResponse(attendance.afternoonCheckOut),
          duration: workingTime.afternoonHours
        },
        workingHours: {
          morning: workingTime.morningHours,
          afternoon: workingTime.afternoonHours,
          total: workingTime.totalTime
        },
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      message: 'Lỗi server khi check-out',
      error: error.message
    });
  }
});

// Get attendance history API
router.get('/attendance/history', authenticate, async (req, res) => {
  try {
    console.log('Fetching attendance history for user:', req.user.userId);

    const user = await User2.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    const history = await Attendance.find({ userId: req.user.userId })
      .sort({ date: -1 })
      .lean();

    const formattedHistory = history.map(record => {
      const workingTime = calculateDailyWorkingTime(record);

      return {
        date: moment(record.date).format('YYYY-MM-DD'),
        morningSession: {
          checkIn: record.morningCheckIn ? formatTimeResponse(record.morningCheckIn) : null,
          checkOut: record.morningCheckOut ? formatTimeResponse(record.morningCheckOut) : null,
          duration: workingTime.morningHours
        },
        afternoonSession: {
          checkIn: record.afternoonCheckIn ? formatTimeResponse(record.afternoonCheckIn) : null,
          checkOut: record.afternoonCheckOut ? formatTimeResponse(record.afternoonCheckOut) : null,
          duration: workingTime.afternoonHours
        },
        totalHours: workingTime.totalTime,
        status: record.status || 'pending'
      };
    });

    res.json({ history: formattedHistory });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy lịch sử chấm công',
      error: error.message
    });
  }
});

// Admin attendance records API
router.get('/attendance/all', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const { startDate, endDate, userId } = req.query;
    const query = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        query.date.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    // Add user filter if provided
    if (userId) {
      query.userId = userId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('userId', 'fullName position')
      .sort({ date: -1 })
      .lean();

    const formattedRecords = attendanceRecords.map(record => {
      const workingTime = calculateDailyWorkingTime(record);

      return {
        ...record,
        morningSession: {
          checkIn: record.morningCheckIn ? formatTimeResponse(record.morningCheckIn) : null,
          checkOut: record.morningCheckOut ? formatTimeResponse(record.morningCheckOut) : null,
          duration: workingTime.morningHours,
          isLate: record.morningCheckIn ?
            moment(record.morningCheckIn).hour() > 8 ||
            (moment(record.morningCheckIn).hour() === 8 && moment(record.morningCheckIn).minute() > 15)
            : null
        },
        afternoonSession: {
          checkIn: record.afternoonCheckIn ? formatTimeResponse(record.afternoonCheckIn) : null,
          checkOut: record.afternoonCheckOut ? formatTimeResponse(record.afternoonCheckOut) : null,
          duration: workingTime.afternoonHours,
          isLate: record.afternoonCheckIn ?
            moment(record.afternoonCheckIn).hour() > 13 ||
            (moment(record.afternoonCheckIn).hour() === 13 && moment(record.afternoonCheckIn).minute() > 45)
            : null
        },
        totalHours: workingTime.totalTime,
        totalMinutes: workingTime.totalMinutes,
        user: record.userId,
        date: moment(record.date).format('YYYY-MM-DD')
      };
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: formattedRecords.length,
      totalLateRecords: formattedRecords.filter(r =>
        r.morningSession.isLate || r.afternoonSession.isLate
      ).length,
      averageWorkingMinutes: formattedRecords.reduce((acc, curr) =>
        acc + curr.totalMinutes, 0) / formattedRecords.length,
      averageWorkingHours: (formattedRecords.reduce((acc, curr) =>
        acc + curr.totalMinutes, 0) / formattedRecords.length / 60).toFixed(2)
    };

    res.json({
      attendanceRecords: formattedRecords,
      summary
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy dữ liệu chấm công',
      error: error.message
    });
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

// Route để cập nhật người dùng
router.put('/admin/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Kiểm tra vai trò của người dùng
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật' });
    }

    // Tìm người dùng trong cả hai collection
    let user = await User2.findById(userId);
    let isUser2 = true;

    if (!user) {
      user = await User.findById(userId);
      isUser2 = false;
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    }

    // Xử lý đặc biệt khi chuyển từ thử việc sang chính thức
    if (updateData.employeeType === 'Chính thức' && user.employeeType === 'Thử việc') {
      if (!updateData.contractType || !updateData.contractStart || !updateData.contractEnd) {
        return res.status(400).json({
          message: 'Vui lòng cung cấp đầy đủ thông tin hợp đồng khi chuyển sang nhân viên chính thức'
        });
      }

      // Chuyển đổi ngày từ chuỗi sang Date
      if (updateData.contractStart) {
        updateData.contractStart = new Date(updateData.contractStart);
      }
      if (updateData.contractEnd) {
        updateData.contractEnd = new Date(updateData.contractEnd);
      }
    }

    // Nếu là admin và đang cập nhật mật khẩu
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Cập nhật người dùng trong collection tương ứng
    const updatedUser = await (isUser2 ? User2 : User).findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Tạo token mới
    const newToken = generateToken({
      userId: updatedUser._id,
      role: updatedUser.role
    });

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: updatedUser,
      newToken
    });
  } catch (error) {
    console.error('Lỗi cập nhật:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

//cập nhật cho user
router.put('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, phoneNumber, username, password } = req.body;

    // Kiểm tra quyền cập nhật và token
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật thông tin này' });
    }

    // Tìm user trong cả hai collection
    let user = await User2.findById(userId);
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật thông tin cơ bản
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (username) user.username = username;

    // Cập nhật mật khẩu nếu có
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    // Tạo token mới với thông tin cập nhật
    const newToken = generateToken({
      userId: user._id,
      role: user.role,
      fullName: user.fullName,
      username: user.username
    });

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        username: user.username,
        position: user.position,
      },
      newToken
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin người dùng:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
});

// ================== API LƯƠNG ==================

// Hàm helper để tính tổng số giờ làm việc
// Hàm tính tổng số giờ làm việc
const calculateTotalWorkHours = (attendanceRecords) => {
  return attendanceRecords.reduce((total, record) => {
    if (record.totalHours) {
      const parts = record.totalHours.split(' ');
      let hours = 0, minutes = 0;

      for (let i = 0; i < parts.length; i += 2) {
        const value = parseInt(parts[i]);
        const unit = parts[i + 1];

        if (unit.includes('giờ')) hours += value;
        else if (unit.includes('phút')) minutes += value;
      }

      return total + hours + minutes / 60;
    }
    return total;
  }, 0);
};

// Giải thích:
// - Hàm này duyệt qua tất cả các bản ghi chấm công (attendanceRecords)
// - Với mỗi bản ghi, nó tách chuỗi totalHours thành các phần (ví dụ: "8 giờ 30 phút")
// - Sau đó, nó tính tổng số giờ và phút
// - Cuối cùng, nó chuyển đổi phút thành giờ (chia cho 60) và cộng vào tổng số giờ

// Ví dụ:
// Nếu có 2 bản ghi: "8 giờ 30 phút" và "7 giờ 45 phút"
// Kết quả sẽ là: (8 + 30/60) + (7 + 45/60) = 8.5 + 7.75 = 16.25 giờ




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

// Cập nhật API endpoint để tính lương có tính đến bonus/penalty từ tasks
router.get('/salary/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }

    let salary = await Salary.findOne({ userId }).populate('userId', 'fullName position');

    if (!salary) {
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

    const attendanceRecords = await Attendance.find({ userId });
    const workingTimeData = await calculateDailyWorkingTime(attendanceRecords[0] || {}, userId);
    
    const standardWorkHours = 176;
    const hourlyRate = salary.basicSalary / standardWorkHours;
    
    // Tính lương thực tế bao gồm cả bonus/penalty từ tasks
    const actualSalary = (hourlyRate * workingTimeData.totalMinutes / 60) + 
                        (salary.bonus || 0) + 
                        workingTimeData.taskBonus - 
                        workingTimeData.taskPenalty;

    const salaryInfo = {
      ...salary.toObject(),
      actualWorkHours: parseFloat((workingTimeData.totalMinutes / 60).toFixed(2)),
      hourlyRate: parseFloat(hourlyRate.toFixed(2)),
      actualSalary: Math.round(actualSalary),
      standardWorkHours,
      taskBonus: workingTimeData.taskBonus,
      taskPenalty: workingTimeData.taskPenalty
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
//Thêm task
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
    priority,
    createdBy // Thêm trường này
  } = req.body;

  try {
    console.log('Received task data:', req.body);

    // Kiểm tra các trường bắt buộc
    if (!title || !dueDate || !assignedTo || !createdBy) {
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
      createdBy, // Sử dụng giá trị từ req.body
      status: 'pending',
      bonus: bonus || 0,
      penalty: penalty || 0,
      priority: priority || 'medium'
    });

    console.log('New task object:', newTask);

    const savedTask = await newTask.save();
    console.log('Saved task:', savedTask);

    await savedTask.populate('assignedTo', 'fullName');
    await savedTask.populate('createdBy', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Công việc đã được thêm thành công',
      task: savedTask
    });
  } catch (error) {
    console.error('Error adding task:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: 'Lỗi khi thêm công việc',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Cập nhật task completion API để cập nhật bonus/penalty
router.put('/tasks/:taskId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    if (task.assignedTo.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc này' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      
      // Kiểm tra và áp dụng bonus/penalty
      const completedDate = new Date(task.completedAt);
      const dueDate = new Date(task.dueDate);

      if (completedDate <= dueDate) {
        // Hoàn thành đúng hoặc sớm hơn deadline
        task.actualPenalty = 0;
      } else {
        // Hoàn thành trễ deadline
        task.actualPenalty = task.penalty || 0;
      }
    }

    await task.save();

    res.json({ 
      message: 'Cập nhật trạng thái công việc thành công', 
      task,
      bonusApplied: completedDate <= dueDate ? task.bonus : 0,
      penaltyApplied: task.actualPenalty
    });
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


module.exports = router;