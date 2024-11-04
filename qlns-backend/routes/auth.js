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
  const { 
    username, 
    fullName, 
    email, 
    password, 
    phoneNumber, 
    position, 
    companyName, 
    city, 
    gender,
    // Thêm các trường câu hỏi bảo mật vào destructuring
    securityQuestion1,
    securityAnswer1,
    securityQuestion2,
    securityAnswer2,
    securityQuestion3,
    securityAnswer3
  } = req.body;

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

    // Validate thông tin câu hỏi bảo mật
    if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2 || !securityQuestion3 || !securityAnswer3) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ câu hỏi và câu trả lời bảo mật' });
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
      role,
      gender,
      // Thêm thông tin bảo mật vào user mới - không mã hóa
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2,
      securityQuestion3,
      securityAnswer3
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
    return res.status(403).json({ message: 'Bạn không có quyền tạo tài khoản' });
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
      gender,
      // Thêm các trường câu hỏi bảo mật
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2,
      securityQuestion3,
      securityAnswer3
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

    // Validate thông tin câu hỏi bảo mật
    if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2 || !securityQuestion3 || !securityAnswer3) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ câu hỏi và câu trả lời bảo mật' });
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
      employeeType: employeeType || 'Thử việc',
      // Thêm thông tin bảo mật
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2,
      securityQuestion3,
      securityAnswer3
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

    // Khởi tạo bản ghi lương cho tháng hiện tại
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const newSalary = new Salary({
      userId: newUser._id,
      month: currentMonth,
      year: currentYear,
      basicSalary: Number(basicSalary),
      bonus: 0,
      workingDays: 0,
      actualWorkHours: 0,
      standardWorkHours: 0,
      taskBonus: 0,
      taskPenalty: 0,
      completedTasks: 0,
      totalSalary: 0
    });

    // Tính số ngày làm việc chuẩn cho tháng hiện tại
    newSalary.calculateWorkingDays();
    await newSalary.save();

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
      salary: newSalary,
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


const LATE_PENALTIES = {
  LEVELS: [
    { minutes: 15, multiplier: 1 },    // 0-15 phút: phạt 1 lần mức cơ bản
    { minutes: 30, multiplier: 2 },    // 16-30 phút: phạt 2 lần mức cơ bản
    { minutes: 60, multiplier: 3 },    // 31-60 phút: phạt 3 lần mức cơ bản
    { minutes: Infinity, multiplier: 4 }// >60 phút: phạt 4 lần mức cơ bản
  ],
  BASE_PENALTY: 25000,                 // Mức phạt cơ bản: 25,000 VND
  MAX_DAILY_PENALTY: 200000            // Giới hạn phạt tối đa/ngày: 200,000 VND
};

// Thêm hàm tính toán mức phạt
const calculateLatePenalty = (lateMinutes) => {
  const level = LATE_PENALTIES.LEVELS.find(l => lateMinutes <= l.minutes);
  const penalty = LATE_PENALTIES.BASE_PENALTY * level.multiplier;
  return Math.min(penalty, LATE_PENALTIES.MAX_DAILY_PENALTY);
};


const handleLatePenalty = async (userId, checkInTime, session, month, year) => {
  let lateMinutes = 0;
  const expectedTime = moment(checkInTime).startOf('day');
  
  if (session === 'morning') {
    expectedTime.add(8, 'hours'); // 8:00
    lateMinutes = moment(checkInTime).diff(expectedTime, 'minutes');
  } else if (session === 'afternoon') {
    expectedTime.add(13, 'hours').add(30, 'minutes'); // 13:30
    lateMinutes = moment(checkInTime).diff(expectedTime, 'minutes');
  }
  
  if (lateMinutes > 0) {
    let salary = await Salary.findOne({ userId, month, year });
    if (!salary) {
      const user = await User2.findById(userId);
      if (!user) throw new Error('Không tìm thấy thông tin người dùng');

      salary = new Salary({
        userId,
        month,
        year,
        basicSalary: user.basicSalary || 0,
        bonus: 0,
        latePenalty: 0,
        lateCount: 0,
        monthlyLateDetails: new Map()
      });
    }

    const penalty = calculateLatePenalty(lateMinutes);
    const monthKey = `${month}-${year}`;
    let monthDetails = salary.monthlyLateDetails.get(monthKey) || [];
    
    monthDetails.push({
      date: moment(checkInTime).startOf('day'),
      minutes: lateMinutes,
      penalty: penalty,
      session: session // Thêm thông tin về buổi sáng/chiều
    });
    
    salary.monthlyLateDetails.set(monthKey, monthDetails);
    salary.latePenalty = monthDetails.reduce((sum, detail) => sum + detail.penalty, 0);
    salary.lateCount = monthDetails.length;

    salary.calculateFinalSalary();
    await salary.save();
  }
};


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
    const currentMonth = now.month() + 1;
    const currentYear = now.year();

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
      },
      month: currentMonth,
      year: currentYear
    });

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: today.toDate(),
        month: currentMonth,
        year: currentYear,
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
      if (attendance.status !== 'late') {
        attendance.status = now.hour() > 13 || (now.hour() === 13 && now.minute() > 45)
          ? 'late'
          : 'present';
      }
    }

    if (period === 'morning') {
      const expectedTime = moment().set({ hour: 8, minute: 0, second: 0 });
      if (now.isAfter(expectedTime)) {
        attendance.status = 'late';
        await handleLatePenalty(userId, now, 'morning', currentMonth, currentYear);
      }
    } else {
      const expectedTime = moment().set({ hour: 13, minute: 30, second: 0 });
      if (now.isAfter(expectedTime)) {
        attendance.status = 'late';
        await handleLatePenalty(userId, now, 'afternoon', currentMonth, currentYear);
      }
    }

    await attendance.save();

    // Cập nhật lại bản ghi lương tháng hiện tại
    let salary = await Salary.findOne({
      userId,
      month: currentMonth,
      year: currentYear
    });

    if (salary) {
      salary.actualWorkHours = attendance.monthlyHours;
      salary.calculateFinalSalary();
      await salary.save();
    }

    res.status(200).json({
      message: 'Check-in thành công',
      attendance: {
        date: now.format('YYYY-MM-DD'),
        morningSession: {
          checkIn: formatTimeResponse(attendance.morningCheckIn),
          checkOut: formatTimeResponse(attendance.morningCheckOut)
        },
        afternoonSession: {
          checkIn: formatTimeResponse(attendance.afternoonCheckIn),
          checkOut: formatTimeResponse(attendance.afternoonCheckOut)
        },
        workingHours: attendance.getFormattedTimes(),
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      message: 'Lỗi server khi check-in',
      error: error.message
    });
  }
});

// Check-out API with manual checkout only
router.post('/attendance/check-out', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const today = now.clone().startOf('day');
    const currentMonth = now.month() + 1;
    const currentYear = now.year();

    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today.toDate(),
        $lt: today.clone().add(1, 'day').toDate()
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công cho hôm nay' });
    }

    // Xử lý check-out theo ca
    const currentTime = now.hour() * 60 + now.minute();
    const { MORNING, AFTERNOON } = TIME_CONSTANTS.WORKING_HOURS;

    // Kiểm tra thời gian check-out
    const isInMorningWindow = currentTime >= MORNING.START && currentTime <= MORNING.END + MORNING.BUFFER;
    const isInAfternoonWindow = currentTime >= AFTERNOON.START && currentTime <= AFTERNOON.END + AFTERNOON.BUFFER;

    if (!isInMorningWindow && !isInAfternoonWindow) {
      return res.status(400).json({ message: 'Ngoài giờ làm việc, không thể check-out' });
    }

    // Cập nhật thời gian check-out
    if (isInMorningWindow) {
      if (!attendance.morningCheckIn) {
        return res.status(400).json({ message: 'Bạn chưa check-in buổi sáng' });
      }
      attendance.morningCheckOut = now.toDate();
    } else {
      if (!attendance.afternoonCheckIn) {
        return res.status(400).json({ message: 'Bạn chưa check-in buổi chiều' });
      }
      attendance.afternoonCheckOut = now.toDate();
    }

    // Tính toán giờ làm việc trong ngày
    let dailyMinutes = 0;
    
    if (attendance.morningCheckIn && attendance.morningCheckOut) {
      dailyMinutes += calculateWorkingTime(attendance.morningCheckIn, attendance.morningCheckOut);
    }
    
    if (attendance.afternoonCheckIn && attendance.afternoonCheckOut) {
      dailyMinutes += calculateWorkingTime(attendance.afternoonCheckIn, attendance.afternoonCheckOut);
    }
    
    attendance.dailyHours = dailyMinutes / 60;
    
    // Tính toán và cập nhật tổng giờ làm việc trong tháng
    const monthlyHours = await calculateMonthlyAttendance(userId, currentMonth, currentYear);
    attendance.monthlyHours = monthlyHours;

    await attendance.save();

    // Trả về response với thông tin chi tiết
    res.status(200).json({
      message: 'Check-out thành công',
      attendance: {
        date: now.format('YYYY-MM-DD'),
        morningSession: {
          checkIn: formatTimeResponse(attendance.morningCheckIn),
          checkOut: formatTimeResponse(attendance.morningCheckOut)
        },
        afternoonSession: {
          checkIn: formatTimeResponse(attendance.afternoonCheckIn),
          checkOut: formatTimeResponse(attendance.afternoonCheckOut)
        },
        workingHours: {
          daily: `${Math.floor(attendance.dailyHours)} giờ ${Math.round((attendance.dailyHours % 1) * 60)} phút`,
          monthly: `${Math.floor(monthlyHours)} giờ ${Math.round((monthlyHours % 1) * 60)} phút`
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
    const userId = req.user.userId;
    const { month, year } = req.query;
    const query = { userId };

    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const history = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    const formattedHistory = history.map(record => ({

      
      date: moment(record.date).format('YYYY-MM-DD'),
      morningSession: {
        checkIn: formatTimeResponse(record.morningCheckIn),
        checkOut: formatTimeResponse(record.morningCheckOut)
      },
      afternoonSession: {
        checkIn: formatTimeResponse(record.afternoonCheckIn),
        checkOut: formatTimeResponse(record.afternoonCheckOut)
      },
      workingHours: {
        daily: record.dailyHours 
          ? `${Math.floor(record.dailyHours)} giờ ${Math.round((record.dailyHours % 1) * 60)} phút`
          : '0 giờ 0 phút',
        monthly: record.monthlyHours
          ? `${Math.floor(record.monthlyHours)} giờ ${Math.round((record.monthlyHours % 1) * 60)} phút`
          : '0 giờ 0 phút'
      },
      status: record.status
    }));

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
    const { month, year, userId } = req.query;
    const query = {};

    // Thêm filter theo tháng và năm
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    } else {
      // Nếu không có tháng năm, lấy tháng hiện tại
      const now = moment().tz('Asia/Ho_Chi_Minh');
      query.month = now.month() + 1;
      query.year = now.year();
    }

    // Thêm filter theo userId nếu có
    if (userId) {
      query.userId = userId;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('userId', 'fullName position')
      .sort({ date: -1 })
      .lean();

    const formattedRecords = await Promise.all(attendanceRecords.map(async record => {
      // Tính toán trạng thái đi muộn
      const morningLate = record.morningCheckIn ? 
        moment(record.morningCheckIn).hour() > 8 || 
        (moment(record.morningCheckIn).hour() === 8 && moment(record.morningCheckIn).minute() > 15)
        : null;

      const afternoonLate = record.afternoonCheckIn ?
        moment(record.afternoonCheckIn).hour() > 13 || 
        (moment(record.afternoonCheckIn).hour() === 13 && moment(record.afternoonCheckIn).minute() > 45)
        : null;

      // Format thời gian làm việc
      const workingTimes = {
        daily: record.dailyHours 
          ? `${Math.floor(record.dailyHours)} giờ ${Math.round((record.dailyHours % 1) * 60)} phút`
          : '0 giờ 0 phút',
        monthly: record.monthlyHours
          ? `${Math.floor(record.monthlyHours)} giờ ${Math.round((record.monthlyHours % 1) * 60)} phút`
          : '0 giờ 0 phút'
      };

      // Lấy thông tin lương của tháng
      const salary = await Salary.findOne({
        userId: record.userId._id,
        month: record.month,
        year: record.year
      });

      return {
        _id: record._id,
        userId: {
          _id: record.userId._id,
          fullName: record.userId.fullName,
          position: record.userId.position
        },
        date: moment(record.date).format('YYYY-MM-DD'),
        month: record.month,
        year: record.year,
        morningSession: {
          checkIn: formatTimeResponse(record.morningCheckIn),
          checkOut: formatTimeResponse(record.morningCheckOut),
          isLate: morningLate
        },
        afternoonSession: {
          checkIn: formatTimeResponse(record.afternoonCheckIn),
          checkOut: formatTimeResponse(record.afternoonCheckOut),
          isLate: afternoonLate
        },
        workingHours: workingTimes,
        monthlyStats: {
          totalHours: record.monthlyHours,
          standardHours: salary ? salary.standardWorkHours : 0,
          workRatio: salary ? 
            ((record.monthlyHours / salary.standardWorkHours) * 100).toFixed(2) + '%' 
            : '0%'
        },
        status: record.status
      };
    }));

    // Tính toán thống kê tổng quan
    const summary = {
      totalRecords: formattedRecords.length,
      totalLateRecords: formattedRecords.filter(r =>
        r.morningSession.isLate || r.afternoonSession.isLate
      ).length,
      averageMonthlyHours: formattedRecords.reduce((acc, curr) =>
        acc + (curr.monthlyStats.totalHours || 0), 0) / formattedRecords.length,
      averageWorkRatio: formattedRecords.reduce((acc, curr) =>
        acc + (parseFloat(curr.monthlyStats.workRatio) || 0), 0) / formattedRecords.length
    };

    res.json({
      attendanceRecords: formattedRecords,
      summary: {
        ...summary,
        averageMonthlyHours: `${Math.floor(summary.averageMonthlyHours)} giờ ${Math.round((summary.averageMonthlyHours % 1) * 60)} phút`,
        averageWorkRatio: `${summary.averageWorkRatio.toFixed(2)}%`
      }
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy dữ liệu chấm công',
      error: error.message
    });
  }
});

// API Thống kê chấm công theo tháng
router.get('/attendance/stats', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const queryMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const queryYear = year ? parseInt(year) : currentDate.getFullYear();

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          month: queryMonth,
          year: queryYear
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDays: { $sum: 1 },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          totalHours: { $sum: '$dailyHours' },
          avgDailyHours: { $avg: '$dailyHours' }
        }
      },
      {
        $lookup: {
          from: 'user2s',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      }
    ]);

    const formattedStats = attendanceStats.map(stat => ({
      userId: stat._id,
      fullName: stat.userInfo.fullName,
      position: stat.userInfo.position,
      totalDays: stat.totalDays,
      lateDays: stat.lateDays,
      attendanceRate: ((stat.totalDays / 22) * 100).toFixed(2) + '%',
      totalHours: `${Math.floor(stat.totalHours)} giờ ${Math.round((stat.totalHours % 1) * 60)} phút`,
      avgDailyHours: `${Math.floor(stat.avgDailyHours)} giờ ${Math.round((stat.avgDailyHours % 1) * 60)} phút`
    }));

    res.json({
      month: queryMonth,
      year: queryYear,
      stats: formattedStats
    });

  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy thống kê chấm công',
      error: error.message
    });
  }
});


// Hàm tính số ngày làm việc trong tháng (không tính T7, CN)
const calculateWorkingDaysInMonth = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  let workingDays = 0;
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // 0 = CN, 6 = T7
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

// Hàm tính tổng giờ làm việc trong tháng
const calculateTotalWorkHoursInMonth = async (userId, month, year) => {
  const attendanceRecords = await Attendance.find({
    userId,
    month,
    year
  });

  return attendanceRecords.reduce((total, record) => {
    return total + (record.dailyHours || 0);
  }, 0);
};

// Hàm kiểm tra và tạo bản ghi lương mới cho tháng
const ensureMonthySalaryRecord = async (userId, month, year) => {
  let salary = await Salary.findOne({
    userId,
    month,
    year
  });

  if (!salary) {
    const user = await User2.findById(userId);
    if (!user) throw new Error('Không tìm thấy thông tin người dùng');

    salary = new Salary({
      userId,
      month,
      year,
      basicSalary: user.basicSalary || 0,
      bonus: 0,
      workingDays: calculateWorkingDaysInMonth(year, month),
      actualWorkHours: 0,
      standardWorkHours: calculateWorkingDaysInMonth(year, month) * 8,
      taskBonus: 0,
      taskPenalty: 0,
      completedTasks: 0,
      totalSalary: 0
    });

    await salary.save();
  }

  return salary;
};

// Hàm format thời gian làm việc
const formatWorkTime = (hours) => {
  if (!hours && hours !== 0) return '0 giờ 0 phút';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} giờ ${minutes} phút`;
};

// Hàm tính tỷ lệ làm việc
const calculateWorkRatio = (actualHours, standardHours) => {
  if (!standardHours) return 0;
  return ((actualHours / standardHours) * 100).toFixed(2);
};

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


// Trong file route API (api/auth.js), thêm/sửa hàm tính lương:
const calculateMonthlyAttendance = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const attendanceRecords = await Attendance.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  let totalMonthlyMinutes = 0;
  
  // Tính tổng thời gian làm việc từ tất cả các bản ghi trong tháng
  attendanceRecords.forEach(record => {
    // Tính giờ làm việc buổi sáng
    if (record.morningCheckIn && record.morningCheckOut) {
      const morningMinutes = calculateWorkingTime(record.morningCheckIn, record.morningCheckOut);
      totalMonthlyMinutes += morningMinutes;
    }
    
    // Tính giờ làm việc buổi chiều
    if (record.afternoonCheckIn && record.afternoonCheckOut) {
      const afternoonMinutes = calculateWorkingTime(record.afternoonCheckIn, record.afternoonCheckOut);
      totalMonthlyMinutes += afternoonMinutes;
    }
  });

   // Chuyển đổi từ phút sang giờ
   const totalMonthlyHours = totalMonthlyMinutes / 60;
  
   // Cập nhật bản ghi lương của tháng
   const salary = await Salary.findOne({ userId, month, year });
   if (salary) {
     salary.actualWorkHours = totalMonthlyHours;
     salary.calculateFinalSalary();
     await salary.save();
   }
   
   return totalMonthlyHours;
 };

// API lấy danh sách lương
// Trong router (api/auth.js)
router.get('/salary', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    // Lấy tháng và năm từ query params
    const queryMonth = parseInt(req.query.month);
    const queryYear = parseInt(req.query.year);

    console.log('Fetching salaries for:', { month: queryMonth, year: queryYear });

    // Tìm tất cả bản ghi lương cho tháng/năm được chọn
    const salaries = await Salary.find({ 
      month: queryMonth,
      year: queryYear
    }).populate('userId', 'fullName position');

    // Lấy tất cả user
    const users = await User2.find({});

    // Tạo map để theo dõi user đã có bản ghi lương
    const salaryMap = new Map(salaries.map(s => [s.userId?._id.toString(), s]));

    // Tạo hoặc cập nhật bản ghi lương cho mỗi user
    const processedSalaries = await Promise.all(users.map(async (user) => {
      let salary = salaryMap.get(user._id.toString());

      // Nếu chưa có bản ghi lương cho user này
      if (!salary) {
        // Tìm bản ghi chấm công
        const attendanceRecords = await Attendance.find({
          userId: user._id,
          month: queryMonth,
          year: queryYear
        });

        // Tính toán số giờ làm việc và thông tin đi muộn
        let totalWorkMinutes = 0;
        let lateCount = 0;
        let latePenalty = 0;
        let lateDetails = [];

        attendanceRecords.forEach(record => {
          // Tính giờ làm việc
          if (record.morningCheckIn && record.morningCheckOut) {
            const morningMinutes = moment(record.morningCheckOut).diff(moment(record.morningCheckIn), 'minutes');
            totalWorkMinutes += Math.max(0, morningMinutes);
          }
          if (record.afternoonCheckIn && record.afternoonCheckOut) {
            const afternoonMinutes = moment(record.afternoonCheckOut).diff(moment(record.afternoonCheckIn), 'minutes');
            totalWorkMinutes += Math.max(0, afternoonMinutes);
          }

          // Xử lý thông tin đi muộn
          if (record.status === 'late') {
            lateCount++;
            const lateDetail = {
              date: record.date,
              minutes: 0,
              penalty: 0
            };

            if (record.morningCheckIn) {
              const expectedTime = moment(record.date).set({ hour: 8, minute: 0 });
              if (moment(record.morningCheckIn).isAfter(expectedTime)) {
                const lateMinutes = moment(record.morningCheckIn).diff(expectedTime, 'minutes');
                lateDetail.minutes += lateMinutes;
                lateDetail.penalty += calculateLatePenalty(lateMinutes);
              }
            }

            if (record.afternoonCheckIn) {
              const expectedTime = moment(record.date).set({ hour: 13, minute: 30 });
              if (moment(record.afternoonCheckIn).isAfter(expectedTime)) {
                const lateMinutes = moment(record.afternoonCheckIn).diff(expectedTime, 'minutes');
                lateDetail.minutes += lateMinutes;
                lateDetail.penalty += calculateLatePenalty(lateMinutes);
              }
            }

            if (lateDetail.minutes > 0) {
              latePenalty += lateDetail.penalty;
              lateDetails.push(lateDetail);
            }
          }
        });

        // Tính task bonus/penalty
        const completedTasks = await Task.find({
          assignedTo: user._id,
          status: 'completed',
          completedAt: {
            $gte: new Date(queryYear, queryMonth - 1, 1),
            $lt: new Date(queryYear, queryMonth, 0)
          }
        });

        // Tạo bản ghi lương mới
        salary = new Salary({
          userId: user._id,
          month: queryMonth,
          year: queryYear,
          basicSalary: user.basicSalary || 0,
          actualWorkHours: totalWorkMinutes / 60,
          lateCount,
          latePenalty,
          lateDetails,
          completedTasks: completedTasks.length,
          taskBonus: completedTasks.reduce((sum, task) => 
            sum + (moment(task.completedAt).isSameOrBefore(task.dueDate) ? (task.bonus || 0) : 0), 0),
          taskPenalty: completedTasks.reduce((sum, task) => 
            sum + (moment(task.completedAt).isAfter(task.dueDate) ? (task.penalty || 0) : 0), 0)
        });

        salary.calculateWorkingDays();
        salary.calculateFinalSalary();
        await salary.save();
      }

      // Populate thông tin user
      if (!salary.userId || typeof salary.userId === 'string') {
        salary.userId = user;
      }

      return salary;
    }));

    // Tính thống kê tổng quát
    const stats = {
      totalEmployees: processedSalaries.length,
      totalWorkHours: processedSalaries.reduce((sum, s) => sum + (s.actualWorkHours || 0), 0),
      totalSalaryPaid: processedSalaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0),
      averageWorkHours: processedSalaries.length > 0 ? 
        processedSalaries.reduce((sum, s) => sum + (s.actualWorkHours || 0), 0) / processedSalaries.length : 0
    };

    res.status(200).json({ 
      salaries: processedSalaries,
      summary: stats
    });

  } catch (error) {
    console.error('Error fetching salary data:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy dữ liệu lương',
      error: error.message
    });
  }
});

// API cập nhật lương
// Trong file router (api/auth.js)
router.post('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    console.log('Received salary update request:', {
      params: req.params,
      body: req.body
    });

    const userId = req.params.id;
    const { basicSalary, bonus, month, year } = req.body;

    // Validate input
    if (!userId || !basicSalary) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Tìm user
    const user = await User2.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    // Tìm bản ghi lương hiện có
    let salary = await Salary.findOne({
      userId,
      month,
      year
    });

    if (salary) {
      // Cập nhật bản ghi hiện có
      salary.basicSalary = Number(basicSalary);
      salary.bonus = Number(bonus) || 0;
    } else {
      // Tạo bản ghi mới
      salary = new Salary({
        userId,
        month,
        year,
        basicSalary: Number(basicSalary),
        bonus: Number(bonus) || 0,
      });
    }

    // Tính toán các thông tin cần thiết
    salary.calculateWorkingDays();
    
    const actualHours = await calculateMonthlyAttendance(userId, month, year);
    salary.actualWorkHours = actualHours;

    // Tính toán task bonuses/penalties
    const tasks = await Task.find({
      assignedTo: userId,
      status: 'completed',
      completedAt: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 0)
      }
    });

    salary.completedTasks = tasks.length;
    salary.taskBonus = tasks.reduce((sum, task) => {
      if (task.completedAt && task.dueDate) {
        return sum + (new Date(task.completedAt) <= new Date(task.dueDate) ? (task.bonus || 0) : 0);
      }
      return sum;
    }, 0);
    salary.taskPenalty = tasks.reduce((sum, task) => {
      if (task.completedAt && task.dueDate) {
        return sum + (new Date(task.completedAt) > new Date(task.dueDate) ? (task.penalty || 0) : 0);
      }
      return sum;
    }, 0);

    // Tính lương cuối cùng và lưu
    salary.calculateFinalSalary();
    const savedSalary = await salary.save();

    // Populate thông tin người dùng
    await savedSalary.populate('userId', 'fullName position');

    res.status(200).json({
      message: 'Cập nhật lương thành công',
      salary: savedSalary
    });

  } catch (error) {
    console.error('Salary update error:', error);
    res.status(500).json({
      message: 'Lỗi khi cập nhật lương',
      error: error.message
    });
  }
});
// API xóa lương
router.delete('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  try {
    await Salary.findOneAndDelete({
      userId: req.params.id,
      month: currentMonth,
      year: currentYear
    });
    res.status(200).json({ message: 'Xóa lương thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa lương:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xóa lương', 
      error: error.message 
    });
  }
});

// Cập nhật API endpoint để tính lương có tính đến bonus/penalty từ tasks
// API để lấy thông tin lương của user
router.get('/salary/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestMonth = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const requestYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    console.log('Fetching salary for:', { userId, month: requestMonth, year: requestYear });

    // Lấy thông tin chấm công của tháng
    const attendanceRecords = await Attendance.find({
      userId,
      month: requestMonth,
      year: requestYear,
      status: 'late'
    }).sort({ date: 1 });

    // Lấy thông tin tasks hoàn thành trong tháng
    const completedTasks = await Task.find({
      assignedTo: userId,
      status: 'completed',
      completedAt: {
        $gte: new Date(requestYear, requestMonth - 1, 1),
        $lt: new Date(requestYear, requestMonth, 0)
      }
    });

    console.log('Completed tasks:', completedTasks.length);

    // Tính toán tổng thưởng/phạt từ tasks
    let totalTaskBonus = 0;
    let totalTaskPenalty = 0;
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completedAt);
      const dueDate = new Date(task.dueDate);
      
      if (completedDate <= dueDate) {
        totalTaskBonus += task.bonus || 0;
      } else {
        totalTaskPenalty += task.penalty || 0;
      }
    });

    console.log('Task rewards calculation:', {
      totalTaskBonus,
      totalTaskPenalty
    });

    // Tìm hoặc tạo bảng lương
    let salary = await Salary.findOne({
      userId,
      month: requestMonth,
      year: requestYear
    }).populate('userId', 'fullName position');

    if (!salary) {
      const user = await User2.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
      }

      salary = new Salary({
        userId: user._id,
        month: requestMonth,
        year: requestYear,
        basicSalary: user.basicSalary || 0,
        bonus: 0,
        taskBonus: totalTaskBonus,
        taskPenalty: totalTaskPenalty,
        completedTasks: completedTasks.length
      });

      // Tính số ngày làm việc
      salary.calculateWorkingDays();
      await salary.save();
    } else {
      // Cập nhật thông tin task bonus/penalty
      salary.taskBonus = totalTaskBonus;
      salary.taskPenalty = totalTaskPenalty;
      salary.completedTasks = completedTasks.length;
      salary.calculateFinalSalary();
      await salary.save();
    }

    // Cập nhật thông tin đi muộn từ bản ghi chấm công
    const lateDetails = attendanceRecords.map(record => {
      const morningLateMinutes = record.morningCheckIn ? 
        moment(record.morningCheckIn).diff(moment(record.date).set({hour: 8, minute: 0}), 'minutes') : 0;
      const afternoonLateMinutes = record.afternoonCheckIn ?
        moment(record.afternoonCheckIn).diff(moment(record.date).set({hour: 13, minute: 30}), 'minutes') : 0;
      const details = [];
      
      if (morningLateMinutes > 15) { // Tính buffer 15 phút
        details.push({
          date: record.date,
          session: 'morning',
          minutes: morningLateMinutes - 15,
          penalty: calculateLatePenalty(morningLateMinutes - 15)
        });
      }
      
      if (afternoonLateMinutes > 15) { // Tính buffer 15 phút
        details.push({
          date: record.date,
          session: 'afternoon', 
          minutes: afternoonLateMinutes - 15,
          penalty: calculateLatePenalty(afternoonLateMinutes - 15)
        });
      }
      return details;
    }).flat();

    // Cập nhật monthlyLateData trong salary
    salary.monthlyLateData = {
      latePenalty: lateDetails.reduce((sum, detail) => sum + detail.penalty, 0),
      lateCount: lateDetails.length,
      lateDetails: lateDetails
    };

    // Tính toán lại lương cuối cùng
    salary.calculateFinalSalary();
    await salary.save();

    // Tính số ngày nghỉ
    const workingDays = salary.workingDays;
    const absentDays = attendanceRecords.length - lateDetails.length;
    const vacationDays = workingDays - attendanceRecords.length;

    // Tính số giờ làm việc thực tế
    const actualWorkHours = salary.actualWorkHours;

    res.json({
      salary: salary,
      attendanceStats: {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => r.status === 'present').length,
        lateDays: lateDetails.length,
        absentDays,
        vacationDays,
        totalWorkHours: actualWorkHours
      }
    });

  } catch (error) {
    console.error('Error fetching salary and attendance data:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy thông tin lương và chấm công',
      error: error.message
    });
  }
});


// API lấy lịch sử lương theo tháng
router.get('/salary-history/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { month, year } = req.query;

    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }

    const query = { userId };
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const salaryHistory = await Salary.find(query)
      .populate('userId', 'fullName position')
      .sort({ year: -1, month: -1 });

    res.json({ salaryHistory });
  } catch (error) {
    console.error('Error fetching salary history:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy lịch sử lương', 
      error: error.message 
    });
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
// Route để cập nhật trạng thái task
router.put('/tasks/:taskId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    // Log thông tin task trước khi cập nhật
    console.log('Task before update:', {
      taskId: task._id,
      oldStatus: task.status,
      newStatus: status,
      dueDate: task.dueDate,
      bonus: task.bonus,
      penalty: task.penalty
    });

    if (task.assignedTo.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc này' });
    }

    const previousStatus = task.status;
    task.status = status;

    // Chỉ xử lý bonus/penalty khi task chuyển sang trạng thái completed lần đầu tiên
    if (status === 'completed' && previousStatus !== 'completed') {
      task.completedAt = new Date();
      const completedDate = new Date(task.completedAt);
      const dueDate = new Date(task.dueDate);

      let bonusApplied = 0;
      let penaltyApplied = 0;

      // Tính toán bonus/penalty
      if (completedDate <= dueDate) {
        bonusApplied = task.bonus || 0;
        task.actualPenalty = 0;
        console.log('Task completed on time! Applying bonus:', bonusApplied);
      } else {
        penaltyApplied = task.penalty || 0;
        task.actualPenalty = penaltyApplied;
        console.log('Task completed late! Applying penalty:', penaltyApplied);
      }

      // Cập nhật bảng lương của tháng hiện tại
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      console.log('Updating salary for:', {
        userId: task.assignedTo,
        month: currentMonth,
        year: currentYear
      });

      let salary = await Salary.findOne({
        userId: task.assignedTo,
        month: currentMonth,
        year: currentYear
      });

      if (!salary) {
        // Tạo bảng lương mới nếu chưa tồn tại
        const user = await User2.findById(task.assignedTo);
        if (!user) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }

        salary = new Salary({
          userId: task.assignedTo,
          month: currentMonth,
          year: currentYear,
          basicSalary: user.basicSalary || 0,
          bonus: 0,
          taskBonus: 0,
          taskPenalty: 0,
          completedTasks: 0
        });

        console.log('Created new salary record for current month');
      }

      // Cập nhật thông tin task bonus/penalty
      console.log('Previous salary values:', {
        taskBonus: salary.taskBonus,
        taskPenalty: salary.taskPenalty,
        completedTasks: salary.completedTasks
      });

      salary.taskBonus = (salary.taskBonus || 0) + bonusApplied;
      salary.taskPenalty = (salary.taskPenalty || 0) + penaltyApplied;
      salary.completedTasks = (salary.completedTasks || 0) + 1;

      // Tính lại tổng lương
      salary.calculateFinalSalary();
      await salary.save();

      console.log('Updated salary values:', {
        taskBonus: salary.taskBonus,
        taskPenalty: salary.taskPenalty,
        completedTasks: salary.completedTasks,
        totalSalary: salary.totalSalary
      });
    }

    await task.save();

    res.json({
      message: 'Cập nhật trạng thái công việc thành công',
      task,
      bonusApplied: task.status === 'completed' ? (task.bonus || 0) : 0,
      penaltyApplied: task.status === 'completed' ? task.actualPenalty : 0
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật trạng thái công việc',
      error: error.message 
    });
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



// Setup job chạy vào đầu mỗi tháng
const setupMonthlyJobs = () => {
  // Chạy vào 00:01 ngày đầu tiên của mỗi tháng
  schedule.scheduleJob('1 0 1 * *', async () => {
    try {
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      console.log(`Starting monthly reset for ${currentMonth}/${currentYear}`);

      // Lấy tất cả user
      const users = await User2.find({});

      // Tạo bản ghi lương mới cho mỗi user
      for (const user of users) {
        const newSalary = new Salary({
          userId: user._id,
          month: currentMonth,
          year: currentYear,
          basicSalary: user.basicSalary || 0,
          bonus: 0,
          workingDays: 0,
          actualWorkHours: 0,
          standardWorkHours: 0,
          taskBonus: 0,
          taskPenalty: 0,
          completedTasks: 0,
          totalSalary: 0
        });

        await newSalary.calculateWorkingDays();
        await newSalary.save();
      }

      console.log('Monthly salary records created successfully');
    } catch (error) {
      console.error('Error in monthly reset job:', error);
    }
  });
};

// Thêm vào cuối file
setupMonthlyJobs();


/////////////////////////////API QUÊN MẬT KHẨU////////////////////
// Thêm vào file auth.js sau phần routes đăng nhập

// Route kiểm tra email và lấy câu hỏi bảo mật
router.post('/forgot-password/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    // Tìm user theo email trong cả hai collection User và User2
    let user = await User.findOne({ email });
    let isAdmin = false;

    if (!user) {
      user = await User2.findOne({ email });
      if (!user) {
        return res.status(404).json({ 
          message: 'Email không tồn tại trong hệ thống' 
        });
      }
      isAdmin = user.role === 'admin';
    } else {
      isAdmin = user.role === 'admin';
    }

    // Chuẩn bị câu hỏi bảo mật để gửi về client
    const securityQuestions = [
      {
        id: 1,
        question: user.securityQuestion1
      },
      {
        id: 2,
        question: user.securityQuestion2
      },
      {
        id: 3,
        question: user.securityQuestion3
      }
    ];

    res.json({
      userId: user._id,
      isAdmin,
      securityQuestions
    });

  } catch (error) {
    console.error('Lỗi kiểm tra email:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi kiểm tra email',
      error: error.message
    });
  }
});

// Route xác thực câu trả lời và đặt lại mật khẩu
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { userId, isAdmin, answers, newPassword } = req.body;

    // Validate input
    if (!userId || !answers || !newPassword || answers.length !== 3) {
      return res.status(400).json({
        message: 'Thiếu thông tin cần thiết'
      });
    }

    // Validate độ dài mật khẩu
    if (newPassword.length <= 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({
        message: 'Mật khẩu phải trên 6 ký tự và chứa ít nhất một ký tự đặc biệt'
      });
    }

    // Tìm user trong collection phù hợp
    const UserModel = isAdmin ? User : User2;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra câu trả lời bảo mật
    const correctAnswers = [
      user.securityAnswer1?.toLowerCase(),
      user.securityAnswer2?.toLowerCase(),
      user.securityAnswer3?.toLowerCase()
    ];

    const isCorrect = answers.every((answer, index) => 
      answer.toLowerCase() === correctAnswers[index]
    );

    if (!isCorrect) {
      return res.status(400).json({
        message: 'Câu trả lời bảo mật không chính xác'
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'Mật khẩu đã được cập nhật thành công'
    });

  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu',
      error: error.message
    });
  }
});

module.exports = router;