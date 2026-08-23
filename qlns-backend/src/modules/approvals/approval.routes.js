const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const approvalService = require('./approval.service');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const mine = req.query.mine === 'true' || req.user.role === ROLES.HR;
  const items = await approvalService.list({
    mine: req.user.role !== ROLES.ADMIN || mine,
    actor: req.user,
    status: req.query.status,
  });
  res.json({ items });
}));

router.patch('/:id', requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const result = await approvalService.decide(req.params.id, req.body, req.user);
  res.json(result);
}));

module.exports = router;
