const schedule = require('node-schedule');
const { User } = require('../models');
const payrollService = require('../modules/payroll/payroll.service');
const { now } = require('../utils/dates');
const { ROLES } = require('../config/constants');

function startMonthlySalaryJob() {
  schedule.scheduleJob('1 0 1 * *', async () => {
    const at = now();
    const month = at.month() + 1;
    const year = at.year();
    const users = await User.find({ status: 'active', role: { $ne: ROLES.ADMIN } });
    for (const user of users) {
      try {
        await payrollService.recompute(user._id, month, year);
      } catch (err) {
        console.error(`Monthly salary failed for ${user.employeeCode}:`, err.message);
      }
    }
  });
}

module.exports = { startMonthlySalaryJob };
