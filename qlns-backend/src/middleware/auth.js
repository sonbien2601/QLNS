const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Bạn cần đăng nhập');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new ApiError(401, 'Phiên đăng nhập hết hạn hoặc không hợp lệ');
    }

    const user = await User.findById(payload.sub)
      .populate('department', 'name code')
      .populate('position', 'name level');
    if (!user || user.status !== 'active') {
      throw new ApiError(401, 'Tài khoản không còn hiệu lực');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Không có quyền thực hiện thao tác này'));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
