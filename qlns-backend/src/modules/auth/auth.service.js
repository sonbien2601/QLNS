const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const { publicUser } = require('../../utils/sanitize');
const { ROLES } = require('../../config/constants');

function sign(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function login({ login, password }) {
  const user = await User.findOne({
    $or: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }],
  }).select('+password');
  if (!user) throw new ApiError(400, 'Tài khoản hoặc mật khẩu không đúng');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new ApiError(400, 'Tài khoản hoặc mật khẩu không đúng');
  if (user.status !== 'active') throw new ApiError(403, 'Tài khoản đã bị khóa');
  const hydrated = await User.findById(user._id).populate('department', 'name').populate('position', 'name');
  return { token: sign(hydrated), user: publicUser(hydrated) };
}

async function bootstrapAdmin(payload) {
  const exists = await User.exists({ role: ROLES.ADMIN });
  if (exists) throw new ApiError(403, 'Hệ thống đã có Admin — không tự đăng ký được');
  const hashed = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    username: payload.username.toLowerCase(),
    email: payload.email.toLowerCase(),
    password: hashed,
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber,
    gender: payload.gender,
    role: ROLES.ADMIN,
    employeeType: 'official',
    positionName: payload.position || 'Giám đốc',
    hiredAt: new Date(),
  });
  return publicUser(user);
}

async function startReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+securityAnswers');
  if (!user) throw new ApiError(404, 'Không tìm thấy tài khoản');
  if (!user.securityAnswers?.length) {
    throw new ApiError(400, 'Tài khoản chưa thiết lập câu hỏi bảo mật — liên hệ Admin');
  }
  return {
    userId: user._id,
    questions: user.securityAnswers.map((a, i) => ({ id: i, question: a.question })),
  };
}

async function completeReset({ userId, answers, newPassword }) {
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'Mật khẩu mới tối thiểu 8 ký tự');
  }
  const user = await User.findById(userId).select('+securityAnswers +password');
  if (!user) throw new ApiError(404, 'Không tìm thấy tài khoản');
  if (!user.securityAnswers?.length || user.securityAnswers.length !== answers.length) {
    throw new ApiError(400, 'Câu trả lời bảo mật không hợp lệ');
  }
  for (let i = 0; i < user.securityAnswers.length; i += 1) {
    const match = await bcrypt.compare(
      String(answers[i] || '').trim().toLowerCase(),
      user.securityAnswers[i].answerHash
    );
    if (!match) throw new ApiError(400, 'Câu trả lời bảo mật không chính xác');
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: 'Đã cập nhật mật khẩu' };
}

module.exports = { login, bootstrapAdmin, startReset, completeReset, sign };
