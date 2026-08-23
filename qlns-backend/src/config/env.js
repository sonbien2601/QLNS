const { config } = require('./load');

const isProd = (process.env.NODE_ENV || config.__env) === 'production' || config.__env === 'production';

function pick(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || config.__env || 'development',
  isProd,
  appEnv: config.__env,
  configDir: config.__dir,
  port: Number(pick(config.server?.port, 5000)),
  mongoUri: pick(config.mongo?.uri, ''),
  jwtSecret: pick(config.jwt?.secret, ''),
  jwtExpiresIn: pick(config.jwt?.expires_in, '8h'),
  corsOrigin: pick(config.cors?.origin, 'http://localhost:3000'),
  corsCredentials: config.cors?.credentials !== false,
  tz: pick(config.server?.timezone, 'Asia/Ho_Chi_Minh'),
  jsonLimit: pick(config.server?.json_limit, '100kb'),
  rateLimit: {
    windowMs: Number(pick(config.rate_limit?.window_ms, 60000)),
    max: Number(pick(config.rate_limit?.max, 120)),
    loginWindowMs: Number(pick(config.rate_limit?.login_window_ms, 900000)),
    loginMax: Number(pick(config.rate_limit?.login_max, 20)),
  },
  seed: config.seed || { enabled: false },
  loggingLevel: pick(config.logging?.level, 'info'),
};

if (!env.mongoUri) {
  throw new Error('Thiếu mongo.uri trong YAML hoặc biến MONGODB_URI');
}
if (!env.jwtSecret) {
  throw new Error('Thiếu jwt.secret trong YAML hoặc biến JWT_SECRET');
}
if (isProd && /change-me|dev-only|not-for-production/i.test(env.jwtSecret)) {
  throw new Error('JWT_SECRET không hợp lệ cho production');
}

module.exports = env;
