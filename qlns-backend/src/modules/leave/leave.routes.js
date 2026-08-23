const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const leaveService = require('./leave.service');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const items = await leaveService.list({ userId: req.query.userId, actor: req.user });
  res.json({ items });
}));

router.get('/balance', asyncHandler(async (req, res) => {
  const bal = await leaveService.myBalance(req.user, Number(req.query.year));
  res.json({ balance: bal });
}));

router.post('/', asyncHandler(async (req, res) => {
  const item = await leaveService.create(req.body, req.user);
  res.status(201).json({ item });
}));

router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const item = await leaveService.decide(req.params.id, req.body, req.user);
  res.json({ item });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await leaveService.cancel(req.params.id, req.user);
  res.json({ item });
}));

module.exports = router;
