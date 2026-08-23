const moment = require('moment-timezone');
const { Attendance, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const { now, startOfDay, isWeekend, periodOf } = require('../../utils/dates');
const { WORK_HOURS } = require('../../config/constants');
const { calcLatePenalty } = require('../../utils/payroll');
const payrollService = require('../payroll/payroll.service');
const env = require('../../config/env');

function workingMinutes(checkIn, checkOut, session) {
  if (!checkIn || !checkOut) return 0;
  const start = moment(checkIn);
  const end = moment(checkOut);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;

  const day = start.clone().tz(env.tz).startOf('day');
  let windowStart;
  let windowEnd;
  if (session === 'morning') {
    windowStart = day.clone().hour(WORK_HOURS.morningStart.hour).minute(WORK_HOURS.morningStart.minute);
    windowEnd = day.clone().hour(WORK_HOURS.morningEnd.hour).minute(WORK_HOURS.morningEnd.minute);
  } else {
    windowStart = day.clone().hour(WORK_HOURS.afternoonStart.hour).minute(WORK_HOURS.afternoonStart.minute);
    windowEnd = day.clone().hour(WORK_HOURS.afternoonEnd.hour).minute(WORK_HOURS.afternoonEnd.minute);
  }
  const effectiveStart = moment.max(start, windowStart);
  const effectiveEnd = moment.min(end, windowEnd);
  return Math.max(0, effectiveEnd.diff(effectiveStart, 'minutes'));
}

async function getToday(userId, at = now()) {
  const day = startOfDay(at);
  return Attendance.findOne({
    user: userId,
    date: { $gte: day.toDate(), $lt: day.clone().add(1, 'day').toDate() },
  });
}

async function checkIn(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
  const at = now();
  if (isWeekend(at)) throw new ApiError(400, 'Hôm nay không phải ngày làm việc');
  const period = periodOf(at);
  if (!period) {
    throw new ApiError(400, 'Ngoài giờ làm việc (08:00–12:00 và 13:30–17:30)');
  }

  const day = startOfDay(at);
  let record = await getToday(userId, at);
  if (!record) {
    record = new Attendance({
      user: userId,
      date: day.toDate(),
      month: at.month() + 1,
      year: at.year(),
      status: 'pending',
    });
  }

  if (period === 'morning') {
    if (record.morningCheckIn) throw new ApiError(400, 'Đã check-in ca sáng');
    record.morningCheckIn = at.toDate();
    const expected = day.clone().hour(8).minute(0);
    const late = Math.max(0, at.diff(expected, 'minutes'));
    if (late > WORK_HOURS.lateGraceMinutes) {
      record.status = 'late';
      record.lateMinutes += late;
      record.latePenalty += calcLatePenalty(late);
    } else if (record.status === 'pending') {
      record.status = 'present';
    }
  } else {
    if (record.afternoonCheckIn) throw new ApiError(400, 'Đã check-in ca chiều');
    record.afternoonCheckIn = at.toDate();
    const expected = day.clone().hour(13).minute(30);
    const late = Math.max(0, at.diff(expected, 'minutes'));
    if (late > WORK_HOURS.lateGraceMinutes) {
      record.status = 'late';
      record.lateMinutes += late;
      record.latePenalty += calcLatePenalty(late);
    } else if (record.status === 'pending') {
      record.status = 'present';
    }
  }

  await record.save();
  return record;
}

async function checkOut(userId) {
  const at = now();
  const record = await getToday(userId, at);
  if (!record) throw new ApiError(404, 'Chưa check-in hôm nay');
  const period = periodOf(at);
  if (!period) throw new ApiError(400, 'Ngoài giờ làm việc, không thể check-out');

  if (period === 'morning') {
    if (!record.morningCheckIn) throw new ApiError(400, 'Chưa check-in ca sáng');
    if (record.morningCheckOut) throw new ApiError(400, 'Đã check-out ca sáng');
    record.morningCheckOut = at.toDate();
  } else {
    if (!record.afternoonCheckIn) throw new ApiError(400, 'Chưa check-in ca chiều');
    if (record.afternoonCheckOut) throw new ApiError(400, 'Đã check-out ca chiều');
    record.afternoonCheckOut = at.toDate();
  }

  const morning = workingMinutes(record.morningCheckIn, record.morningCheckOut, 'morning');
  const afternoon = workingMinutes(record.afternoonCheckIn, record.afternoonCheckOut, 'afternoon');
  record.dailyMinutes = morning + afternoon;
  await record.save();

  await payrollService.recompute(userId, at.month() + 1, at.year()).catch(() => {});
  return record;
}

async function history(userId, month, year) {
  return Attendance.find({ user: userId, month: Number(month), year: Number(year) }).sort({ date: 1 });
}

async function all(month, year) {
  return Attendance.find({ month: Number(month), year: Number(year) })
    .populate('user', 'fullName employeeCode positionName department')
    .sort({ date: -1 });
}

async function stats(month, year) {
  const records = await Attendance.find({ month: Number(month), year: Number(year) });
  const byStatus = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  return {
    total: records.length,
    byStatus,
    lateCount: records.filter((r) => r.status === 'late').length,
    totalLatePenalty: records.reduce((s, r) => s + (r.latePenalty || 0), 0),
  };
}

module.exports = { checkIn, checkOut, history, all, stats, getToday };
