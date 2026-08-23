const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middleware/auth');
const { publicUser } = require('../../utils/sanitize');
const authService = require('./auth.service');
const env = require('../../config/env');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: env.rateLimit.loginWindowMs,
  max: env.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Thử đăng nhập quá nhiều lần, vui lòng đợi 15 phút' },
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }
  const result = await authService.login({ login, password });
  res.json(result);
}));

router.post('/bootstrap-admin', asyncHandler(async (req, res) => {
  const user = await authService.bootstrapAdmin(req.body);
  res.status(201).json({ message: 'Đã tạo Admin đầu tiên', user });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
}));

router.post('/forgot-password/check-email', loginLimiter, asyncHandler(async (req, res) => {
  const data = await authService.startReset(req.body.email);
  res.json(data);
}));

router.post('/forgot-password/verify', loginLimiter, asyncHandler(async (req, res) => {
  const data = await authService.completeReset(req.body);
  res.json(data);
}));

module.exports = router;
