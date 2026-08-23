const bcrypt = require('bcryptjs');
const { User, Contract, LeaveBalance, Salary } = require('../../models');
const ApiError = require('../../utils/apiError');
const { workingDaysInMonth, yearsOfService } = require('../../utils/dates');
const { CONTRACT_TYPES, CONTRACT_STATUS, EMPLOYEE_TYPES, ROLES, ANNUAL_LEAVE, DEFINITE_CONTRACT } = require('../../config/constants');
const { publicUser } = require('../../utils/sanitize');

const ROLE_BY_POSITION_HINT = {
  'Nhân viên nhân sự': ROLES.HR,
  'Trưởng phòng nhân sự': ROLES.HR,
  'Nhân viên tài vụ': ROLES.FINANCE,
  'Kế toán': ROLES.FINANCE,
  'Trưởng phòng tài chính': ROLES.FINANCE,
};

async function nextEmployeeCode() {
  const last = await User.findOne({ employeeCode: { $exists: true } })
    .sort({ employeeCode: -1 })
    .select('employeeCode')
    .lean();
  const n = last?.employeeCode ? Number(last.employeeCode.replace(/\D/g, '')) + 1 : 1;
  return `NV${String(n).padStart(4, '0')}`;
}

function annualLeaveEntitlement(hiredAt, year) {
  const years = yearsOfService(hiredAt, new Date(`${year}-12-31`));
  return ANNUAL_LEAVE.baseDays + Math.floor(years / ANNUAL_LEAVE.extraPerYears);
}

async function createEmployee(payload, actor) {
  const existing = await User.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { username: payload.username.toLowerCase() }],
  });
  if (existing) {
    throw new ApiError(400, existing.email === payload.email.toLowerCase()
      ? 'Email đã được sử dụng'
      : 'Tên đăng nhập đã được sử dụng');
  }

  if (payload.employeeType === EMPLOYEE_TYPES.OFFICIAL && payload.contractType === CONTRACT_TYPES.PROBATION) {
    throw new ApiError(400, 'Nhân viên chính thức không dùng hợp đồng thử việc');
  }

  const hashed = await bcrypt.hash(payload.password, 10);
  let answers = [];
  if (payload.securityAnswers?.length === 3) {
    answers = await Promise.all(payload.securityAnswers.map(async (item) => ({
      question: item.question,
      answerHash: await bcrypt.hash(item.answer.trim().toLowerCase(), 10),
    })));
  }

  const positionName = payload.positionName || '';
  const role = payload.role || ROLE_BY_POSITION_HINT[positionName] || ROLES.EMPLOYEE;

  const user = await User.create({
    employeeCode: await nextEmployeeCode(),
    username: payload.username.toLowerCase(),
    email: payload.email.toLowerCase(),
    password: hashed,
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber,
    gender: payload.gender,
    role,
    department: payload.department || null,
    position: payload.position || null,
    positionName,
    employeeType: payload.employeeType || EMPLOYEE_TYPES.PROBATION,
    basicSalary: Number(payload.basicSalary) || 0,
    insuranceSalary: Number(payload.insuranceSalary || payload.basicSalary) || 0,
    allowances: Number(payload.allowances) || 0,
    dependents: Number(payload.dependents) || 0,
    hiredAt: payload.hiredAt ? new Date(payload.hiredAt) : new Date(),
    probationEnd: payload.probationEnd ? new Date(payload.probationEnd) : null,
    securityAnswers: answers,
  });

  if (payload.contractType) {
    if (payload.contractType === CONTRACT_TYPES.DEFINITE || payload.contractType === CONTRACT_TYPES.SEASONAL) {
      if (!payload.contractEnd) throw new ApiError(400, 'Hợp đồng xác định thời hạn cần ngày kết thúc');
      const start = new Date(payload.contractStart || user.hiredAt);
      const end = new Date(payload.contractEnd);
      if (end <= start) throw new ApiError(400, 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu');
      const months = (end - start) / (1000 * 60 * 60 * 24 * 30);
      if (payload.contractType === CONTRACT_TYPES.DEFINITE && months > DEFINITE_CONTRACT.maxMonths) {
        throw new ApiError(400, `HĐLĐ xác định thời hạn tối đa ${DEFINITE_CONTRACT.maxMonths} tháng (Đ.20 BLLĐ 2019)`);
      }
    }

    await Contract.create({
      user: user._id,
      contractType: payload.contractType,
      startDate: payload.contractStart || user.hiredAt,
      endDate: payload.contractEnd || null,
      status: CONTRACT_STATUS.ACTIVE,
      signedSalary: user.basicSalary,
      definiteSequence: 1,
    });
  }

  const now = new Date();
  const year = now.getFullYear();
  await LeaveBalance.create({
    user: user._id,
    year,
    entitled: annualLeaveEntitlement(user.hiredAt, year),
    used: 0,
  });

  const month = now.getMonth() + 1;
  const workingDays = workingDaysInMonth(year, month);
  await Salary.create({
    user: user._id,
    month,
    year,
    basicSalary: user.basicSalary,
    allowances: user.allowances,
    workingDays,
    standardHours: workingDays * 8,
    status: 'draft',
  });

  return publicUser(user);
}

async function updateEmployee(userId, payload) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');

  const allowed = [
    'fullName', 'phoneNumber', 'gender', 'department', 'position', 'positionName',
    'employeeType', 'basicSalary', 'insuranceSalary', 'allowances', 'dependents',
    'hiredAt', 'probationEnd', 'status', 'role',
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) user[key] = payload[key];
  }
  if (payload.password) {
    user.password = await bcrypt.hash(payload.password, 10);
  }
  await user.save();
  return publicUser(await user.populate(['department', 'position']));
}

async function listEmployees({ q, role, department, status }) {
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { employeeCode: new RegExp(q, 'i') },
      { username: new RegExp(q, 'i') },
    ];
  }
  const users = await User.find(filter)
    .populate('department', 'name code')
    .populate('position', 'name level')
    .sort({ createdAt: -1 });
  return users.map(publicUser);
}

module.exports = {
  createEmployee,
  updateEmployee,
  listEmployees,
  annualLeaveEntitlement,
  nextEmployeeCode,
};
