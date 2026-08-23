const moment = require('moment-timezone');
const { Appointment, Dismissal, Resignation, User, Contract } = require('../../models');
const ApiError = require('../../utils/apiError');
const { NOTICE_DAYS, CONTRACT_TYPES, ROLES } = require('../../config/constants');
const env = require('../../config/env');

function noticeRequired(contractType) {
  if (contractType === CONTRACT_TYPES.INDEFINITE) return NOTICE_DAYS.indefinite;
  if (contractType === CONTRACT_TYPES.DEFINITE) return NOTICE_DAYS.definite;
  if (contractType === CONTRACT_TYPES.SEASONAL) return NOTICE_DAYS.seasonal;
  return NOTICE_DAYS.probation;
}

async function executeAppointment(payload, actor) {
  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  const oldPositionName = user.positionName || 'Chưa có';
  if (oldPositionName === payload.newPositionName) {
    throw new ApiError(400, 'Vị trí mới phải khác vị trí hiện tại');
  }

  const appointment = await Appointment.create({
    user: user._id,
    oldPositionName,
    newPosition: payload.newPosition || null,
    newPositionName: payload.newPositionName,
    reason: payload.reason,
    effectiveDate: payload.effectiveDate,
    status: 'approved',
    createdBy: actor._id,
    processedBy: actor._id,
    processedAt: new Date(),
  });

  user.positionName = payload.newPositionName;
  if (payload.newPosition) user.position = payload.newPosition;
  if (payload.newDepartment) user.department = payload.newDepartment;
  await user.save();
  return appointment;
}

async function requestAppointment(payload, actor) {
  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  return Appointment.create({
    user: user._id,
    oldPositionName: user.positionName || 'Chưa có',
    newPosition: payload.newPosition || null,
    newPositionName: payload.newPositionName,
    reason: payload.reason,
    effectiveDate: payload.effectiveDate,
    status: 'pending',
    createdBy: actor._id,
  });
}

async function executeDismissal(payload, actor) {
  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  const oldPositionName = user.positionName || 'Chưa có';
  if (oldPositionName === payload.newPositionName) {
    throw new ApiError(400, 'Vị trí mới phải khác vị trí hiện tại');
  }
  const dismissal = await Dismissal.create({
    user: user._id,
    oldPositionName,
    newPositionName: payload.newPositionName,
    reason: payload.reason,
    effectiveDate: payload.effectiveDate,
    status: 'approved',
    createdBy: actor._id,
    processedBy: actor._id,
    processedAt: new Date(),
  });
  user.positionName = payload.newPositionName;
  await user.save();
  return dismissal;
}

async function createResignation(payload, actor) {
  if (String(actor._id) !== String(payload.userId) && ![ROLES.ADMIN, ROLES.HR].includes(actor.role)) {
    throw new ApiError(403, 'Không thể tạo đơn nghỉ việc hộ người khác');
  }
  const user = await User.findById(payload.userId || actor._id);
  const contract = await Contract.findOne({ user: user._id, status: 'active' }).sort({ startDate: -1 });
  const required = noticeRequired(contract?.contractType || CONTRACT_TYPES.INDEFINITE);
  const lastWorkingDay = moment(payload.lastWorkingDay).tz(env.tz).startOf('day');
  const given = lastWorkingDay.diff(moment().tz(env.tz).startOf('day'), 'days');
  if (given < 0) throw new ApiError(400, 'Ngày làm việc cuối không hợp lệ');

  return Resignation.create({
    user: user._id,
    reason: payload.reason,
    lastWorkingDay: lastWorkingDay.toDate(),
    noticeDaysRequired: required,
    noticeDaysGiven: given,
    lawful: given >= required,
    handoverNote: payload.handoverNote || '',
    status: 'pending',
  });
}

async function decideResignation(id, { status, adminResponse }, actor) {
  if (![ROLES.ADMIN, ROLES.HR].includes(actor.role)) {
    throw new ApiError(403, 'Không có quyền xử lý nghỉ việc');
  }
  const item = await Resignation.findById(id);
  if (!item) throw new ApiError(404, 'Không tìm thấy đơn nghỉ việc');
  if (item.status !== 'pending') throw new ApiError(400, 'Đơn đã được xử lý');
  item.status = status;
  item.adminResponse = adminResponse;
  item.processedBy = actor._id;
  item.processedAt = new Date();
  if (status === 'approved') {
    await User.findByIdAndUpdate(item.user, { status: 'inactive' });
    await Contract.updateMany({ user: item.user, status: 'active' }, { status: 'terminated' });
  }
  await item.save();
  return item;
}

async function listAppointments(filter = {}) {
  return Appointment.find(filter)
    .populate('user', 'fullName employeeCode positionName')
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 });
}

async function listDismissals(filter = {}) {
  return Dismissal.find(filter)
    .populate('user', 'fullName employeeCode positionName')
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 });
}

async function listResignations(filter = {}) {
  return Resignation.find(filter)
    .populate('user', 'fullName employeeCode positionName')
    .sort({ createdAt: -1 });
}

module.exports = {
  executeAppointment,
  requestAppointment,
  executeDismissal,
  createResignation,
  decideResignation,
  listAppointments,
  listDismissals,
  listResignations,
  noticeRequired,
};
