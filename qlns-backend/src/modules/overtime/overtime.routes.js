const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const overtimeService = require('./overtime.service');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const items = await overtimeService.list({ userId: req.query.userId, actor: req.user });
  res.json({ items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const item = await overtimeService.create(req.body, req.user);
  res.status(201).json({ item });
}));

router.patch('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const item = await overtimeService.decide(req.params.id, req.body, req.user);
  res.json({ item });
}));

module.exports = router;
