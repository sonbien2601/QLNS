const { Salary, Attendance, Overtime, Task, User } = require('../../models');
const { calculatePayslip } = require('../../utils/payroll');
const { workingDaysInMonth } = require('../../utils/dates');
const ApiError = require('../../utils/apiError');
const { ROLES } = require('../../config/constants');

async function ensureSalary(user, month, year) {
  let salary = await Salary.findOne({ user: user._id, month, year });
  const workingDays = workingDaysInMonth(year, month);
  if (!salary) {
    salary = await Salary.create({
      user: user._id,
      month,
      year,
      basicSalary: user.basicSalary,
      allowances: user.allowances,
      workingDays,
      standardHours: workingDays * 8,
    });
  }
  return salary;
}

async function recompute(userId, month, year) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  const salary = await ensureSalary(user, month, year);

  const records = await Attendance.find({ user: userId, month, year });
  const actualMinutes = records.reduce((sum, r) => sum + (r.dailyMinutes || 0), 0);
  const latePenalty = records.reduce((sum, r) => sum + (r.latePenalty || 0), 0);

  const ots = await Overtime.find({
    user: userId,
    status: 'approved',
    date: {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    },
  });
  const overtimePay = ots.reduce((sum, o) => sum + (o.payAmount || 0), 0);

  const tasks = await Task.find({
    assignedTo: userId,
    status: 'completed',
    completedAt: {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    },
  });
  let taskBonus = 0;
  let taskPenalty = 0;
  for (const t of tasks) {
    if (t.completedAt <= t.dueDate) taskBonus += t.bonus || 0;
    else taskPenalty += t.penalty || 0;
  }

  salary.basicSalary = user.basicSalary;
  salary.allowances = user.allowances;
  salary.latePenalty = latePenalty;
  salary.overtimePay = overtimePay;
  salary.taskBonus = taskBonus;
  salary.taskPenalty = taskPenalty;
  salary.workingDays = workingDaysInMonth(year, month);
  salary.standardHours = salary.workingDays * 8;
  const actualHours = Number((actualMinutes / 60).toFixed(2));
  // Chưa có công trong tháng: tạm tính đủ công (phiếu dự kiến), tránh net = 0 giữa tháng.
  salary.actualHours = records.length === 0 ? salary.standardHours : actualHours;

  const contract = { employeeType: user.employeeType, contractType: 'indefinite' };
  const Contract = require('../../models/Contract');
  const active = await Contract.findOne({ user: user._id, status: 'active' }).sort({ startDate: -1 });
  if (active) contract.contractType = active.contractType;

  const snapshot = calculatePayslip({
    basicSalary: salary.basicSalary,
    allowances: salary.allowances,
    bonus: salary.bonus,
    taskBonus: salary.taskBonus,
    taskPenalty: salary.taskPenalty,
    latePenalty: salary.latePenalty,
    overtimePay: salary.overtimePay,
    workingDays: salary.workingDays,
    standardHours: salary.standardHours,
    actualHours: salary.actualHours,
    dependents: user.dependents,
    employeeType: user.employeeType,
    contractType: contract.contractType,
    insuranceSalary: user.insuranceSalary || user.basicSalary,
  });
  salary.snapshot = snapshot;
  await salary.save();
  return salary;
}

async function listSalaries({ month, year, actor }) {
  const filter = { month: Number(month), year: Number(year) };
  const salaries = await Salary.find(filter).populate('user', 'fullName employeeCode positionName role status');
  if (actor.role === ROLES.FINANCE) {
    return salaries.filter((s) => s.user && s.user.role !== ROLES.ADMIN);
  }
  return salaries;
}

async function mySalary(userId, month, year) {
  return recompute(userId, month, year);
}

async function updateSalary({ userId, month, year, bonus, allowances, basicSalary }) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  if (basicSalary !== undefined) {
    user.basicSalary = Number(basicSalary);
    await user.save();
  }
  const salary = await ensureSalary(user, month, year);
  if (bonus !== undefined) salary.bonus = Number(bonus);
  if (allowances !== undefined) {
    salary.allowances = Number(allowances);
    user.allowances = Number(allowances);
    await user.save();
  }
  await salary.save();
  return recompute(userId, month, year);
}

async function setStatus(id, status, actor) {
  if (![ROLES.ADMIN, ROLES.FINANCE].includes(actor.role)) {
    throw new ApiError(403, 'Chỉ Tài chính / Admin chốt lương');
  }
  const salary = await Salary.findById(id);
  if (!salary) throw new ApiError(404, 'Không tìm thấy phiếu lương');
  salary.status = status;
  await salary.save();
  return salary;
}

module.exports = { recompute, listSalaries, mySalary, updateSalary, ensureSalary, setStatus };
