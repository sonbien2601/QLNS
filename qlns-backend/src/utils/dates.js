const moment = require('moment-timezone');
const env = require('../config/env');
const { WORK_HOURS } = require('../config/constants');

function now() {
  return moment().tz(env.tz);
}

function startOfDay(date) {
  return moment(date).tz(env.tz).startOf('day');
}

function isWeekend(date) {
  const day = moment(date).tz(env.tz).day();
  return day === 0 || day === 6;
}

function workingDaysInMonth(year, month) {
  const start = moment.tz({ year, month: month - 1, day: 1 }, env.tz);
  const end = start.clone().endOf('month');
  let count = 0;
  const cursor = start.clone();
  while (cursor.isSameOrBefore(end, 'day')) {
    if (!isWeekend(cursor)) count += 1;
    cursor.add(1, 'day');
  }
  return count;
}

function minutesOfDay(m) {
  return m.hour() * 60 + m.minute();
}

function periodOf(m) {
  const t = minutesOfDay(m);
  const morningStart = WORK_HOURS.morningStart.hour * 60 + WORK_HOURS.morningStart.minute;
  const morningEnd = WORK_HOURS.morningEnd.hour * 60 + WORK_HOURS.morningEnd.minute;
  const afternoonStart = WORK_HOURS.afternoonStart.hour * 60 + WORK_HOURS.afternoonStart.minute;
  const afternoonEnd = WORK_HOURS.afternoonEnd.hour * 60 + WORK_HOURS.afternoonEnd.minute;
  if (t >= morningStart && t <= morningEnd) return 'morning';
  if (t >= afternoonStart && t <= afternoonEnd) return 'afternoon';
  return null;
}

function yearsOfService(startDate, atDate = new Date()) {
  if (!startDate) return 0;
  return Math.max(0, moment(atDate).diff(moment(startDate), 'years'));
}

module.exports = {
  now,
  startOfDay,
  isWeekend,
  workingDaysInMonth,
  minutesOfDay,
  periodOf,
  yearsOfService,
};
