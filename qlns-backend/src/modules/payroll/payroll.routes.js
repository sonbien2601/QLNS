const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES, APPROVAL_TYPES } = require('../../config/constants');
const payrollService = require('./payroll.service');
const approvalService = require('../approvals/approval.service');
const ApiError = require('../../utils/apiError');

const router = Router();
router.use(authenticate);

router.get('/', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const salaries = await payrollService.listSalaries({ month, year, actor: req.user });
  res.json({ salaries });
}));

router.get('/me', asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const salary = await payrollService.mySalary(req.user._id, month, year);
  res.json({ salary });
}));

router.get('/:userId', asyncHandler(async (req, res) => {
  const self = String(req.user._id) === req.params.userId;
  if (!self && ![ROLES.ADMIN, ROLES.HR, ROLES.FINANCE].includes(req.user.role)) {
    throw new ApiError(403, 'Không có quyền xem lương người khác');
  }
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const salary = await payrollService.recompute(req.params.userId, month, year);
  res.json({ salary });
}));

router.put('/:userId', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.SALARY_UPDATE,
    payload: {
      userId: req.params.userId,
      month: Number(req.body.month),
      year: Number(req.body.year),
      bonus: req.body.bonus,
      allowances: req.body.allowances,
      basicSalary: req.body.basicSalary,
    },
    actor: req.user,
  });
  res.json(result);
}));

router.patch('/:id/status', requireRole(ROLES.ADMIN, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const salary = await payrollService.setStatus(req.params.id, req.body.status, req.user);
  res.json({ salary });
}));

module.exports = router;
