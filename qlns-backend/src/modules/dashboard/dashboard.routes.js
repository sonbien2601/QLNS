const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const { User, Attendance, LeaveRequest, Approval, Salary, Resignation } = require('../../models');
const { ROLES } = require('../../config/constants');
const payrollService = require('../payroll/payroll.service');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const role = req.user.role;

  if (role === ROLES.EMPLOYEE) {
    const salary = await payrollService.mySalary(req.user._id, month, year);
    const attendance = await Attendance.find({ user: req.user._id, month, year });
    const leaves = await LeaveRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);
    return res.json({
      me: true,
      salary,
      attendanceSummary: {
        days: attendance.length,
        late: attendance.filter((a) => a.status === 'late').length,
        minutes: attendance.reduce((s, a) => s + (a.dailyMinutes || 0), 0),
      },
      recentLeaves: leaves,
    });
  }

  const [headcount, pendingApprovals, pendingLeaves, pendingResign, salaries] = await Promise.all([
    User.countDocuments({ status: 'active', role: { $ne: ROLES.ADMIN } }),
    Approval.countDocuments({ status: 'pending' }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    Resignation.countDocuments({ status: 'pending' }),
    Salary.find({ month, year }),
  ]);

  const payrollCost = salaries.reduce((s, item) => s + (item.snapshot?.employerCost || 0), 0);
  const netTotal = salaries.reduce((s, item) => s + (item.snapshot?.net || 0), 0);

  const byDept = await User.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  res.json({
    headcount,
    pendingApprovals,
    pendingLeaves,
    pendingResign,
    payrollCost,
    netTotal,
    byDept,
    month,
    year,
  });
}));

module.exports = router;
