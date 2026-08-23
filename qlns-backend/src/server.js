const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');
const { startMonthlySalaryJob } = require('./jobs/monthlySalary');

async function main() {
  await connectDb();
  startMonthlySalaryJob();
  app.listen(env.port, () => {
    console.log(`QLNS API http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Không khởi động được server:', err);
  process.exit(1);
});
