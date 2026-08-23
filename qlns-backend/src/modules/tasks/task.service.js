const { Task } = require('../../models');
const ApiError = require('../../utils/apiError');
const { ROLES } = require('../../config/constants');
const payrollService = require('../payroll/payroll.service');

async function create(payload, actor) {
  return Task.create({ ...payload, createdBy: actor._id });
}

async function list({ userId, actor }) {
  const filter = {};
  if (userId) filter.assignedTo = userId;
  else if (actor.role === ROLES.EMPLOYEE) filter.assignedTo = actor._id;
  return Task.find(filter)
    .populate('assignedTo', 'fullName employeeCode')
    .populate('createdBy', 'fullName')
    .sort({ dueDate: 1 });
}

async function complete(id, actor) {
  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');
  if (String(task.assignedTo) !== String(actor._id) && actor.role === ROLES.EMPLOYEE) {
    throw new ApiError(403, 'Không phải việc được giao cho bạn');
  }
  task.status = 'completed';
  task.completedAt = new Date();
  await task.save();
  const month = task.completedAt.getMonth() + 1;
  const year = task.completedAt.getFullYear();
  await payrollService.recompute(task.assignedTo, month, year).catch(() => {});
  return task;
}

async function update(id, payload) {
  const task = await Task.findByIdAndUpdate(id, payload, { new: true });
  if (!task) throw new ApiError(404, 'Không tìm thấy công việc');
  return task;
}

async function remove(id) {
  await Task.findByIdAndDelete(id);
}

module.exports = { create, list, complete, update, remove };
