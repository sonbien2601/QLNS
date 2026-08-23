const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const { APPROVAL_TYPES } = require('../../config/constants');
const { publicUser } = require('../../utils/sanitize');
const { User } = require('../../models');
const employeeService = require('./employee.service');
const approvalService = require('../approvals/approval.service');
const ApiError = require('../../utils/apiError');

const router = Router();
router.use(authenticate);

router.get('/', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const users = await employeeService.listEmployees(req.query);
  res.json({ users });
}));

router.put('/me', asyncHandler(async (req, res) => {
  const user = await employeeService.updateEmployee(req.user._id, {
    phoneNumber: req.body.phoneNumber,
    fullName: req.body.fullName,
  });
  res.json(user);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const self = String(req.user._id) === req.params.id;
  if (!self && ![ROLES.ADMIN, ROLES.HR, ROLES.FINANCE].includes(req.user.role)) {
    throw new ApiError(403, 'Không có quyền xem hồ sơ này');
  }
  const user = await User.findById(req.params.id).populate('department').populate('position');
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');
  res.json(publicUser(user));
}));

router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.EMPLOYEE_CREATE,
    payload: req.body,
    actor: req.user,
  });
  res.status(201).json(result);
}));

router.put('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.EMPLOYEE_UPDATE,
    payload: { userId: req.params.id, updateData: req.body },
    actor: req.user,
  });
  res.json(result);
}));

router.put('/:id/me', asyncHandler(async (req, res) => {
  if (String(req.user._id) !== req.params.id) throw new ApiError(403, 'Chỉ sửa hồ sơ của mình');
  const allowed = {
    phoneNumber: req.body.phoneNumber,
    fullName: req.body.fullName,
  };
  const user = await employeeService.updateEmployee(req.params.id, allowed);
  res.json(user);
}));

module.exports = router;
