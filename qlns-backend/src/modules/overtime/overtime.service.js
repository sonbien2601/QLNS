const { Overtime, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const { OVERTIME_LIMITS, ROLES } = require('../../config/constants');
const { calcOvertimePay } = require('../../utils/payroll');
const { workingDaysInMonth, isWeekend } = require('../../utils/dates');
const payrollService = require('../payroll/payroll.service');

async function hoursUsed(userId, date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const [monthDocs, yearDocs] = await Promise.all([
    Overtime.find({ user: userId, status: 'approved', date: { $gte: monthStart, $lt: monthEnd } }),
    Overtime.find({ user: userId, status: 'approved', date: { $gte: yearStart, $lt: yearEnd } }),
  ]);
  return {
    month: monthDocs.reduce((s, o) => s + o.hours, 0),
    year: yearDocs.reduce((s, o) => s + o.hours, 0),
  };
}

function detectKind(date, kind) {
  if (kind) return kind;
  return isWeekend(date) ? 'weekend' : 'weekday';
}

async function create(payload, actor) {
  const userId = payload.userId || actor._id;
  if (String(userId) !== String(actor._id) && ![ROLES.ADMIN, ROLES.HR].includes(actor.role)) {
    throw new ApiError(403, 'Không thể tạo tăng ca hộ');
  }
  if (payload.hours > OVERTIME_LIMITS.maxHoursPerDay) {
    throw new ApiError(400, 'Tăng ca một ngày không quá 4 giờ (Đ.107 BLLĐ)');
  }
  const used = await hoursUsed(userId, payload.date);
  if (used.month + payload.hours > OVERTIME_LIMITS.maxHoursPerMonth) {
    throw new ApiError(400, 'Vượt trần tăng ca 40 giờ/tháng');
  }
  if (used.year + payload.hours > OVERTIME_LIMITS.maxHoursPerYear) {
    throw new ApiError(400, 'Vượt trần tăng ca 200 giờ/năm');
  }
  return Overtime.create({
    user: userId,
    date: payload.date,
    hours: payload.hours,
    kind: detectKind(payload.date, payload.kind),
    reason: payload.reason,
  });
}

async function decide(id, { status }, actor) {
  if (![ROLES.ADMIN, ROLES.HR].includes(actor.role)) throw new ApiError(403, 'Không có quyền duyệt tăng ca');
  const item = await Overtime.findById(id);
  if (!item) throw new ApiError(404, 'Không tìm thấy phiếu tăng ca');
  if (item.status !== 'pending') throw new ApiError(400, 'Phiếu đã xử lý');
  item.status = status;
  item.processedBy = actor._id;
  item.processedAt = new Date();
  if (status === 'approved') {
    const user = await User.findById(item.user);
    const month = new Date(item.date).getMonth() + 1;
    const year = new Date(item.date).getFullYear();
    const standardHours = workingDaysInMonth(year, month) * 8;
    const hourly = standardHours ? user.basicSalary / standardHours : 0;
    item.payAmount = calcOvertimePay(hourly, item.hours, item.kind);
    await item.save();
    await payrollService.recompute(item.user, month, year).catch(() => {});
  } else {
    await item.save();
  }
  return item;
}

async function list({ userId, actor }) {
  const filter = {};
  if (userId) filter.user = userId;
  else if (![ROLES.ADMIN, ROLES.HR, ROLES.FINANCE].includes(actor.role)) filter.user = actor._id;
  return Overtime.find(filter).populate('user', 'fullName employeeCode').sort({ date: -1 });
}

module.exports = { create, decide, list, hoursUsed };
