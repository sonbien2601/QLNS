const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES, APPROVAL_TYPES } = require('../../config/constants');
const contractService = require('./contract.service');
const approvalService = require('../approvals/approval.service');
const ApiError = require('../../utils/apiError');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  let userId = req.query.userId;
  if (![ROLES.ADMIN, ROLES.HR].includes(req.user.role)) {
    userId = req.user._id;
  }
  const contracts = await contractService.list(userId);
  res.json({ contracts });
}));

router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.HR) {
    const result = await approvalService.submitOrExecute({
      type: APPROVAL_TYPES.CONTRACT_UPDATE,
      payload: { contractId: null, updateData: req.body, create: true, ...req.body },
      actor: req.user,
    });
    return res.status(201).json(result);
  }
  const contract = await contractService.create(req.body);
  res.status(201).json({ contract });
}));

router.put('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const result = await approvalService.submitOrExecute({
    type: APPROVAL_TYPES.CONTRACT_UPDATE,
    payload: { contractId: req.params.id, updateData: req.body },
    actor: req.user,
  });
  res.json(result);
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
  if (String(req.user._id) !== req.params.userId && ![ROLES.ADMIN, ROLES.HR].includes(req.user.role)) {
    throw new ApiError(403, 'Không có quyền xem hợp đồng này');
  }
  const contracts = await contractService.list(req.params.userId);
  res.json({ contracts });
}));

module.exports = router;
