const moment = require('moment-timezone');
const { LeaveRequest, LeaveBalance, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const { isWeekend, yearsOfService } = require('../../utils/dates');
const { LEAVE_TYPES, ROLES } = require('../../config/constants');
const { annualLeaveEntitlement } = require('../employees/employee.service');
const env = require('../../config/env');

function countLeaveDays(start, end) {
  const from = moment(start).tz(env.tz).startOf('day');
  const to = moment(end).tz(env.tz).startOf('day');
  if (to.isBefore(from)) throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  let days = 0;
  const cursor = from.clone();
  while (cursor.isSameOrBefore(to, 'day')) {
    if (!isWeekend(cursor)) days += 1;
    cursor.add(1, 'day');
  }
  return days;
}

async function ensureBalance(user, year) {
  let bal = await LeaveBalance.findOne({ user: user._id, year });
  if (!bal) {
    bal = await LeaveBalance.create({
      user: user._id,
      year,
      entitled: annualLeaveEntitlement(user.hiredAt, year),
      used: 0,
    });
  }
  return bal;
}

async function create(payload, actor) {
  const user = await User.findById(payload.userId || actor._id);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  if (String(user._id) !== String(actor._id) && ![ROLES.ADMIN, ROLES.HR].includes(actor.role)) {
    throw new ApiError(403, 'Không thể tạo đơn phép hộ');
  }
  const days = countLeaveDays(payload.startDate, payload.endDate);
  if (payload.type === LEAVE_TYPES.ANNUAL) {
    const year = moment(payload.startDate).year();
    const bal = await ensureBalance(user, year);
    if (bal.used + days > bal.entitled) {
      throw new ApiError(400, `Không đủ phép năm (còn ${bal.entitled - bal.used} ngày)`);
    }
  }
  return LeaveRequest.create({
    user: user._id,
    type: payload.type,
    startDate: payload.startDate,
    endDate: payload.endDate,
    days,
    reason: payload.reason,
  });
}

async function decide(id, { status, adminResponse }, actor) {
  if (![ROLES.ADMIN, ROLES.HR].includes(actor.role)) {
    throw new ApiError(403, 'Không có quyền duyệt phép');
  }
  const item = await LeaveRequest.findById(id);
  if (!item) throw new ApiError(404, 'Không tìm thấy đơn');
  if (item.status !== 'pending') throw new ApiError(400, 'Đơn đã xử lý');
  item.status = status;
  item.adminResponse = adminResponse;
  item.processedBy = actor._id;
  item.processedAt = new Date();
  if (status === 'approved' && item.type === LEAVE_TYPES.ANNUAL) {
    const year = moment(item.startDate).year();
    const user = await User.findById(item.user);
    const bal = await ensureBalance(user, year);
    bal.used += item.days;
    await bal.save();
  }
  await item.save();
  return item;
}

async function cancel(id, actor) {
  const item = await LeaveRequest.findById(id);
  if (!item) throw new ApiError(404, 'Không tìm thấy đơn');
  if (String(item.user) !== String(actor._id)) throw new ApiError(403, 'Không thể hủy đơn của người khác');
  if (item.status !== 'pending') throw new ApiError(400, 'Chỉ hủy đơn đang chờ duyệt');
  item.status = 'cancelled';
  await item.save();
  return item;
}

async function list({ userId, actor }) {
  const filter = {};
  if (userId) filter.user = userId;
  else if (![ROLES.ADMIN, ROLES.HR].includes(actor.role)) filter.user = actor._id;
  return LeaveRequest.find(filter)
    .populate('user', 'fullName employeeCode positionName')
    .sort({ createdAt: -1 });
}

async function myBalance(user, year) {
  return ensureBalance(user, year || new Date().getFullYear());
}

module.exports = { create, decide, cancel, list, myBalance, ensureBalance, countLeaveDays, yearsOfService };
