const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const attendanceService = require('./attendance.service');

const router = Router();
router.use(authenticate);

router.post('/check-in', asyncHandler(async (req, res) => {
  const record = await attendanceService.checkIn(req.user._id);
  res.json({ message: 'Check-in thành công', record });
}));

router.post('/check-out', asyncHandler(async (req, res) => {
  const record = await attendanceService.checkOut(req.user._id);
  res.json({ message: 'Check-out thành công', record });
}));

router.get('/today', asyncHandler(async (req, res) => {
  const record = await attendanceService.getToday(req.user._id);
  res.json({ record });
}));

router.get('/history', asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const userId = req.query.userId && [ROLES.ADMIN, ROLES.HR, ROLES.FINANCE].includes(req.user.role)
    ? req.query.userId
    : req.user._id;
  const records = await attendanceService.history(userId, month, year);
  res.json({ records });
}));

router.get('/all', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const records = await attendanceService.all(month, year);
  res.json({ records });
}));

router.get('/stats', requireRole(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  res.json(await attendanceService.stats(month, year));
}));

module.exports = router;
