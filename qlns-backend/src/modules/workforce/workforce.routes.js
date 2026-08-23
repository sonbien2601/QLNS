const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES, APPROVAL_TYPES } = require('../../config/constants');
const workforceService = require('./workforce.service');
const approvalService = require('../approvals/approval.service');
const ApiError = require('../../utils/apiError');

const router = Router();
router.use(authenticate);

router.get('/appointments', asyncHandler(async (req, res) => {
  const filter = {};
  if (![ROLES.ADMIN, ROLES.HR].includes(req.user.role)) filter.user = req.user._id;
  const items = await workforceService.listAppointments(filter);
  res.json({ items });
}));

router.post('/appointments', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.APPOINTMENT,
    payload: req.body,
    actor: req.user,
  });
  res.status(201).json(result);
}));

router.get('/dismissals', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const items = await workforceService.listDismissals();
  res.json({ items });
}));

router.post('/dismissals', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.DISMISSAL,
    payload: req.body,
    actor: req.user,
  });
  res.status(201).json(result);
}));

router.get('/resignations', asyncHandler(async (req, res) => {
  const filter = {};
  if (![ROLES.ADMIN, ROLES.HR].includes(req.user.role)) filter.user = req.user._id;
  const items = await workforceService.listResignations(filter);
  res.json({ items });
}));

router.post('/resignations', asyncHandler(async (req, res) => {
  const item = await workforceService.createResignation(
    { ...req.body, userId: req.body.userId || req.user._id },
    req.user
  );
  res.status(201).json({ item });
}));

router.patch('/resignations/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const item = await workforceService.decideResignation(req.params.id, req.body, req.user);
  res.json({ item });
}));

router.delete('/resignations/:id', asyncHandler(async (req, res) => {
  const { Resignation } = require('../../models');
  const item = await Resignation.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: 'pending',
  });
  if (!item) throw new ApiError(404, 'Không tìm thấy đơn chờ duyệt để hủy');
  item.status = 'cancelled';
  await item.save();
  res.json({ item });
}));

module.exports = router;
