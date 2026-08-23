const env = require('../config/env');
const ApiError = require('../utils/apiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Không tìm thấy ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.status || err.name === 'ValidationError'
    ? err.message
    : 'Lỗi máy chủ';

  const body = { message };
  if (err.details) body.details = err.details;
  if (!env.isProd && status === 500) body.debug = err.message;

  if (status >= 500) console.error(err);
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
