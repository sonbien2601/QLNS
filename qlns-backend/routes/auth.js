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
const router = express.Router(); // Tạo router từ Express


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
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Xác minh token
    req.user = decoded; // Gắn thông tin người dùng vào request
    next(); // Tiếp tục xử lý request
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' }); // Nếu token không hợp lệ, trả về lỗi 401
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
      staffSize,
      role,
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
    contractStatus 
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
      contractStatus
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
        contractStatus: newUser.contractStatus
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


// ================== API HỢP ĐỒNG ==================



// API để lấy danh sách hợp đồng từ User2
router.get('/contracts', authenticate, async (req, res) => {
  try {
    const users = await User2.find({}, 'fullName position contractType contractStart contractEnd contractStatus');
    const contracts = users.map(user => ({
      _id: user._id,
      employeeId: {
        _id: user._id,
        fullName: user.fullName,
        position: user.position
      },
      contractType: user.contractType,
      startDate: user.contractStart,
      endDate: user.contractEnd,
      status: user.contractStatus === 'active' ? 'Còn hiệu lực' : 'Hết hiệu lực'
    }));
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

// API để cập nhật hợp đồng
router.put('/contracts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractType, startDate, endDate, status } = req.body;

    const updatedContract = await Contract.findByIdAndUpdate(
      id,
      { contractType, startDate, endDate, status },
      { new: true, runValidators: true }
    ).populate('employeeId', 'fullName position');

    if (!updatedContract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    }

    // Cập nhật thông tin hợp đồng cho nhân viên
    await User2.findByIdAndUpdate(updatedContract.employeeId, {
      contractType,
      contractStart: startDate,
      contractEnd: endDate,
      contractStatus: status === 'Còn hiệu lực' ? 'active' : 'inactive'
    });

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

// Hàm helper để tính tổng số giờ làm việc
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

// API lấy danh sách lương
router.get('/salary', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  try {
    const salaries = await Salary.find().populate('userId', 'fullName position');

    const updatedSalaries = await Promise.all(salaries.map(async (salary) => {
      const attendanceRecords = await Attendance.find({ userId: salary.userId._id });
      const actualWorkHours = calculateTotalWorkHours(attendanceRecords);
      
      const standardWorkHours = 176; // 8 giờ * 22 ngày
      const hourlyRate = salary.basicSalary / standardWorkHours;
      const actualSalary = hourlyRate * actualWorkHours + salary.bonus;

      return {
        ...salary.toObject(),
        actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
        hourlyRate: parseFloat(hourlyRate.toFixed(2)),
        actualSalary: Math.round(actualSalary),
        standardWorkHours,
      };
    }));

    res.json({ salaries: updatedSalaries });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({ message: 'Lỗi khi lấy lương', error: error.message });
  }
});


router.post('/salary/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }

  const { basicSalary, bonus, workingDays } = req.body;

  try {
    const standardWorkHours = workingDays * 8;
    const totalSalary = basicSalary + bonus;

    const salaryData = {
      userId: req.params.id,
      basicSalary,
      bonus,
      totalSalary,
      workingDays,
      standardWorkHours,
    };

    const existingSalary = await Salary.findOneAndUpdate(
      { userId: req.params.id },
      salaryData,
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Cập nhật lương thành công', salary: existingSalary });
  } catch (error) {
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
    res.status(500).json({ message: 'Lỗi khi xóa lương', error: error.message });
  }
});

//API lấy lương cho người dùng
router.get('/salary/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kiểm tra xem người dùng có quyền xem thông tin lương này không
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin này' });
    }

    const salary = await Salary.findOne({ userId }).populate('userId', 'fullName position');

    if (!salary) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin lương' });
    }

    const attendanceRecords = await Attendance.find({ userId });
    const actualWorkHours = calculateTotalWorkHours(attendanceRecords);

    const standardWorkHours = 176; // 8 giờ * 22 ngày
    const hourlyRate = salary.basicSalary / standardWorkHours;
    const actualSalary = hourlyRate * actualWorkHours + salary.bonus;

    const salaryInfo = {
      ...salary.toObject(),
      actualWorkHours: parseFloat(actualWorkHours.toFixed(2)),
      hourlyRate: parseFloat(hourlyRate.toFixed(2)),
      actualSalary: Math.round(actualSalary),
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


module.exports = router;
