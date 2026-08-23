const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDb } = require('../src/config/db');
const {
  User, Department, Position, Contract, LeaveBalance, Salary,
  Attendance, Overtime, Appointment, Dismissal, Resignation, Approval, Task,
} = require('../src/models');
const { workingDaysInMonth } = require('../src/utils/dates');
const { calculatePayslip } = require('../src/utils/payroll');
const env = require('../src/config/env');
const { ANNUAL_LEAVE } = require('../src/config/constants');

const PASSWORD = env.seed?.password || 'Demo@12345';
const SECURITY_ANSWER = env.seed?.security_answer || 'hanoi';

async function main() {
  console.log('Seeding vào', env.mongoUri.replace(/:([^:@/]+)@/, ':***@'));
  await connectDb();
  const collections = [
    User, Department, Position, Contract, LeaveBalance, Salary,
    Attendance, Overtime, Appointment, Dismissal, Resignation, Approval, Task,
  ];
  await Promise.all(collections.map((m) => m.deleteMany({})));

  const hash = await bcrypt.hash(PASSWORD, 10);
  if (env.seed && env.seed.enabled === false) {
    throw new Error('Seed bị tắt trong YAML (seed.enabled: false)');
  }
  const qa = await bcrypt.hash(SECURITY_ANSWER, 10);

  const hrDept = await Department.create({ name: 'Nhân sự', code: 'HR', description: 'Tuyển dụng, C&B, quan hệ lao động' });
  const finDept = await Department.create({ name: 'Tài chính', code: 'FIN', description: 'Kế toán và lương' });
  const engDept = await Department.create({ name: 'Kỹ thuật', code: 'ENG', description: 'Sản phẩm và kỹ thuật' });
  const opsDept = await Department.create({ name: 'Hành chính', code: 'OPS', description: 'Vận hành văn phòng' });

  const posHr = await Position.create({ name: 'Chuyên viên nhân sự', department: hrDept._id, level: 'staff', probationCategory: 'professional' });
  const posFin = await Position.create({ name: 'Kế toán lương', department: finDept._id, level: 'staff', probationCategory: 'professional' });
  const posDev = await Position.create({ name: 'Kỹ sư phần mềm', department: engDept._id, level: 'staff', probationCategory: 'professional' });
  const posLead = await Position.create({ name: 'Trưởng nhóm kỹ thuật', department: engDept._id, level: 'lead', probationCategory: 'executive' });
  await Position.create({ name: 'Trợ lý hành chính', department: opsDept._id, level: 'staff', probationCategory: 'intermediate' });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const wd = workingDaysInMonth(year, month);

  const admin = await User.create({
    employeeCode: 'NV0001',
    username: 'admin',
    email: 'admin@qlns.vn',
    password: hash,
    fullName: 'Nguyễn Quản Trị',
    phoneNumber: '0900000001',
    gender: 'male',
    role: 'admin',
    positionName: 'Giám đốc',
    employeeType: 'official',
    basicSalary: 40000000,
    insuranceSalary: 40000000,
    hiredAt: new Date(`${year - 5}-01-15`),
    securityAnswers: [{ question: 'Thành phố bạn sinh ra?', answerHash: qa }],
  });

  const hr = await User.create({
    employeeCode: 'NV0002',
    username: 'hr',
    email: 'hr@qlns.vn',
    password: hash,
    fullName: 'Trần Mai Hương',
    phoneNumber: '0900000002',
    gender: 'female',
    role: 'hr',
    department: hrDept._id,
    position: posHr._id,
    positionName: 'Chuyên viên nhân sự',
    employeeType: 'official',
    basicSalary: 18000000,
    insuranceSalary: 18000000,
    allowances: 1500000,
    dependents: 1,
    hiredAt: new Date(`${year - 3}-03-01`),
    securityAnswers: [{ question: 'Thành phố bạn sinh ra?', answerHash: qa }],
  });

  const finance = await User.create({
    employeeCode: 'NV0003',
    username: 'finance',
    email: 'finance@qlns.vn',
    password: hash,
    fullName: 'Lê Quốc Kế',
    phoneNumber: '0900000003',
    gender: 'male',
    role: 'finance',
    department: finDept._id,
    position: posFin._id,
    positionName: 'Kế toán lương',
    employeeType: 'official',
    basicSalary: 17000000,
    insuranceSalary: 17000000,
    hiredAt: new Date(`${year - 2}-06-01`),
    securityAnswers: [{ question: 'Thành phố bạn sinh ra?', answerHash: qa }],
  });

  const emp1 = await User.create({
    employeeCode: 'NV0004',
    username: 'an.pham',
    email: 'an.pham@qlns.vn',
    password: hash,
    fullName: 'Phạm Hoàng An',
    phoneNumber: '0900000004',
    gender: 'male',
    role: 'employee',
    department: engDept._id,
    position: posDev._id,
    positionName: 'Kỹ sư phần mềm',
    employeeType: 'official',
    basicSalary: 20000000,
    insuranceSalary: 20000000,
    allowances: 2000000,
    dependents: 0,
    hiredAt: new Date(`${year - 1}-02-10`),
    securityAnswers: [{ question: 'Thành phố bạn sinh ra?', answerHash: qa }],
  });

  const emp2 = await User.create({
    employeeCode: 'NV0005',
    username: 'linh.do',
    email: 'linh.do@qlns.vn',
    password: hash,
    fullName: 'Đỗ Khánh Linh',
    phoneNumber: '0900000005',
    gender: 'female',
    role: 'employee',
    department: engDept._id,
    position: posLead._id,
    positionName: 'Trưởng nhóm kỹ thuật',
    employeeType: 'probation',
    basicSalary: 22000000,
    insuranceSalary: 22000000,
    hiredAt: new Date(),
    probationEnd: new Date(Date.now() + 60 * 24 * 3600 * 1000),
    securityAnswers: [{ question: 'Thành phố bạn sinh ra?', answerHash: qa }],
  });

  await Contract.create([
    { user: hr._id, contractType: 'indefinite', startDate: hr.hiredAt, signedSalary: hr.basicSalary, status: 'active' },
    { user: finance._id, contractType: 'definite', startDate: finance.hiredAt, endDate: new Date(`${year + 1}-06-01`), signedSalary: finance.basicSalary, status: 'active', definiteSequence: 1 },
    { user: emp1._id, contractType: 'indefinite', startDate: emp1.hiredAt, signedSalary: emp1.basicSalary, status: 'active' },
    { user: emp2._id, contractType: 'probation', startDate: emp2.hiredAt, endDate: emp2.probationEnd, signedSalary: emp2.basicSalary, status: 'active' },
  ]);

  const staff = [hr, finance, emp1, emp2];
  for (const u of staff) {
    const years = Math.floor((now - u.hiredAt) / (365.25 * 24 * 3600 * 1000));
    await LeaveBalance.create({
      user: u._id,
      year,
      entitled: ANNUAL_LEAVE.baseDays + Math.floor(years / ANNUAL_LEAVE.extraPerYears),
      used: 0,
    });
    const contract = await Contract.findOne({ user: u._id, status: 'active' });
    const snapshot = calculatePayslip({
      basicSalary: u.basicSalary,
      allowances: u.allowances || 0,
      workingDays: wd,
      standardHours: wd * 8,
      actualHours: wd * 8,
      dependents: u.dependents || 0,
      employeeType: u.employeeType,
      contractType: contract?.contractType || 'indefinite',
      insuranceSalary: u.insuranceSalary || u.basicSalary,
    });
    await Salary.create({
      user: u._id, month, year, basicSalary: u.basicSalary, allowances: u.allowances || 0,
      workingDays: wd, standardHours: wd * 8, actualHours: wd * 8, snapshot, status: 'draft',
    });
  }

  await Task.create({
    title: 'Hoàn thiện báo cáo sprint',
    description: 'Tổng hợp burndown và rủi ro',
    dueDate: new Date(Date.now() + 5 * 86400000),
    assignedTo: emp1._id,
    createdBy: hr._id,
    bonus: 300000,
    penalty: 100000,
    priority: 'high',
  });

  console.log('Seed xong. Tài khoản demo (mật khẩu chung: Demo@12345)');
  console.log('  admin / admin@qlns.vn');
  console.log('  hr / hr@qlns.vn');
  console.log('  finance / finance@qlns.vn');
  console.log('  an.pham / an.pham@qlns.vn  (nhân viên chính thức)');
  console.log('  linh.do / linh.do@qlns.vn  (thử việc — chưa đóng BHXH)');
  console.log(`Admin id: ${admin._id}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
