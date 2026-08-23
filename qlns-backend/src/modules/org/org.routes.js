const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth');
const { ROLES } = require('../../config/constants');
const orgService = require('./org.service');

const router = Router();
router.use(authenticate);

router.get('/departments', asyncHandler(async (req, res) => {
  res.json({ items: await orgService.listDepartments() });
}));

router.post('/departments', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  res.status(201).json({ item: await orgService.createDepartment(req.body) });
}));

router.get('/positions', asyncHandler(async (req, res) => {
  res.json({ items: await orgService.listPositions(req.query.department) });
}));

router.post('/positions', requireRole(ROLES.ADMIN, ROLES.HR), asyncHandler(async (req, res) => {
  res.status(201).json({ item: await orgService.createPosition(req.body) });
}));

router.get('/chart', asyncHandler(async (req, res) => {
  res.json({ items: await orgService.orgChart() });
}));

module.exports = router;
