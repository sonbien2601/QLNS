const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: env.corsCredentials }));
app.use(express.json({ limit: env.jsonLimit }));
app.use(rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'qlns-api', env: env.appEnv });
});

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/employees', require('./modules/employees/employee.routes'));
app.use('/api/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/payroll', require('./modules/payroll/payroll.routes'));
app.use('/api/contracts', require('./modules/contracts/contract.routes'));
app.use('/api/leave', require('./modules/leave/leave.routes'));
app.use('/api/overtime', require('./modules/overtime/overtime.routes'));
app.use('/api/workforce', require('./modules/workforce/workforce.routes'));
app.use('/api/approvals', require('./modules/approvals/approval.routes'));
app.use('/api/org', require('./modules/org/org.routes'));
app.use('/api/tasks', require('./modules/tasks/task.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
