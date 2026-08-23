const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const taskService = require('./task.service');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const items = await taskService.list({ userId: req.query.userId, actor: req.user });
  res.json({ items });
}));

router.post('/', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  const item = await taskService.create(req.body, req.user);
  res.status(201).json({ item });
}));

router.put('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  res.json({ item: await taskService.update(req.params.id, req.body) });
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  res.json({ item: await taskService.complete(req.params.id, req.user) });
}));

router.delete('/:id', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  await taskService.remove(req.params.id);
  res.json({ message: 'Đã xóa' });
}));

module.exports = router;
