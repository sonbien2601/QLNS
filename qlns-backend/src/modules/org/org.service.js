const { Department, Position, User } = require('../../models');
const ApiError = require('../../utils/apiError');

async function listDepartments() {
  return Department.find({ isActive: true }).sort({ name: 1 });
}

async function createDepartment(payload) {
  return Department.create(payload);
}

async function listPositions(department) {
  const filter = { isActive: true };
  if (department) filter.department = department;
  return Position.find(filter).populate('department', 'name code').sort({ name: 1 });
}

async function createPosition(payload) {
  return Position.create(payload);
}

async function orgChart() {
  const departments = await Department.find({ isActive: true });
  const users = await User.find({ status: 'active' }).select('fullName role positionName department');
  return departments.map((d) => ({
    ...d.toObject(),
    members: users.filter((u) => u.department && String(u.department) === String(d._id)),
  }));
}

async function removeDepartment(id) {
  const inUse = await User.exists({ department: id, status: 'active' });
  if (inUse) throw new ApiError(400, 'Phòng ban vẫn còn nhân sự');
  await Department.findByIdAndUpdate(id, { isActive: false });
}

module.exports = {
  listDepartments,
  createDepartment,
  listPositions,
  createPosition,
  orgChart,
  removeDepartment,
};
