const { config } = require('./load');

function numOrInf(value, fallback) {
  if (value === Infinity || value === '.inf' || value === '.Inf' || value === '.INF') return Infinity;
  if (value === null || value === undefined || value === '') {
    return fallback === undefined ? Infinity : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : Infinity;
}

function parseHm(value, fallbackHour, fallbackMinute = 0) {
  if (typeof value === 'string' && value.includes(':')) {
    const [h, m] = value.split(':').map((p) => Number(p));
    return { hour: h, minute: m || 0 };
  }
  if (value && typeof value === 'object') {
    return { hour: Number(value.hour), minute: Number(value.minute) || 0 };
  }
  return { hour: fallbackHour, minute: fallbackMinute };
}

const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  FINANCE: 'finance',
  EMPLOYEE: 'employee',
};

const EMPLOYEE_TYPES = {
  PROBATION: 'probation',
  OFFICIAL: 'official',
};

const CONTRACT_TYPES = {
  INDEFINITE: 'indefinite',
  DEFINITE: 'definite',
  SEASONAL: 'seasonal',
  PROBATION: 'probation',
};

const CONTRACT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
};

const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  UNPAID: 'unpaid',
  MARRIAGE: 'marriage',
  BEREAVEMENT: 'bereavement',
  MATERNITY: 'maternity',
};

const overtime = config.overtime || {};
const OVERTIME_RATES = {
  weekday: Number(overtime.rates?.weekday ?? 1.5),
  weekend: Number(overtime.rates?.weekend ?? 2),
  holiday: Number(overtime.rates?.holiday ?? 3),
};

const OVERTIME_LIMITS = {
  maxHoursPerDay: Number(overtime.max_hours_per_day ?? 4),
  maxHoursPerMonth: Number(overtime.max_hours_per_month ?? 40),
  maxHoursPerYear: Number(overtime.max_hours_per_year ?? 200),
};

const wh = config.work_hours || {};
const WORK_HOURS = {
  morningStart: parseHm(wh.morning_start, 8),
  morningEnd: parseHm(wh.morning_end, 12),
  afternoonStart: parseHm(wh.afternoon_start, 13, 30),
  afternoonEnd: parseHm(wh.afternoon_end, 17, 30),
  lateGraceMinutes: Number(wh.late_grace_minutes ?? 15),
  hoursPerDay: Number(wh.hours_per_day ?? 8),
};

const lp = config.late_penalties || {};
const LATE_PENALTIES = {
  levels: (lp.levels || []).map((level) => ({
    minutes: numOrInf(level.minutes),
    multiplier: Number(level.multiplier),
  })),
  basePenalty: Number(lp.base_penalty ?? 25000),
  maxDailyPenalty: Number(lp.max_daily_penalty ?? 200000),
};

const pay = config.payroll || {};
const REFERENCE_SALARY = Number(pay.reference_salary ?? 2530000);
const SI_HI_CAP = REFERENCE_SALARY * Number(pay.si_hi_cap_multiplier ?? 20);
const REGIONAL_MIN_WAGE_I = Number(pay.regional_min_wage_i ?? 5310000);
const UI_CAP = REGIONAL_MIN_WAGE_I * Number(pay.ui_cap_multiplier ?? 20);

const INSURANCE_RATES = {
  employee: {
    bhxh: Number(pay.insurance?.employee?.bhxh ?? 0.08),
    bhyt: Number(pay.insurance?.employee?.bhyt ?? 0.015),
    bhtn: Number(pay.insurance?.employee?.bhtn ?? 0.01),
  },
  employer: {
    bhxh: Number(pay.insurance?.employer?.bhxh ?? 0.175),
    bhyt: Number(pay.insurance?.employer?.bhyt ?? 0.03),
    bhtn: Number(pay.insurance?.employer?.bhtn ?? 0.01),
  },
};

const pit = pay.pit || {};
const PIT = {
  personalDeduction: Number(pit.personal_deduction ?? 15500000),
  dependentDeduction: Number(pit.dependent_deduction ?? 6200000),
  brackets: (pit.brackets || []).map((b) => ({
    upTo: numOrInf(b.up_to),
    rate: Number(b.rate),
  })),
};

const labor = config.labor || {};
const PROBATION_MAX_DAYS = {
  executive: Number(labor.probation_max_days?.executive ?? 180),
  professional: Number(labor.probation_max_days?.professional ?? 60),
  intermediate: Number(labor.probation_max_days?.intermediate ?? 30),
  simple: Number(labor.probation_max_days?.simple ?? 6),
};

const NOTICE_DAYS = {
  indefinite: Number(labor.notice_days?.indefinite ?? 45),
  definite: Number(labor.notice_days?.definite ?? 30),
  seasonal: Number(labor.notice_days?.seasonal ?? 3),
  probation: Number(labor.notice_days?.probation ?? 0),
};

const ANNUAL_LEAVE = {
  baseDays: Number(labor.annual_leave_base_days ?? 12),
  extraPerYears: Number(labor.annual_leave_extra_per_years ?? 5),
};

const DEFINITE_CONTRACT = {
  maxMonths: Number(labor.definite_contract_max_months ?? 36),
  maxRenewals: Number(labor.definite_contract_max_renewals ?? 2),
};

const APPROVAL_TYPES = {
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_UPDATE: 'employee.update',
  SALARY_UPDATE: 'salary.update',
  APPOINTMENT: 'appointment.create',
  DISMISSAL: 'dismissal.create',
  RESIGNATION_DECIDE: 'resignation.decide',
  CONTRACT_UPDATE: 'contract.update',
  OVERTIME_APPROVE: 'overtime.approve',
};

const SENSITIVE_TYPES = new Set([
  APPROVAL_TYPES.EMPLOYEE_CREATE,
  APPROVAL_TYPES.EMPLOYEE_UPDATE,
  APPROVAL_TYPES.SALARY_UPDATE,
  APPROVAL_TYPES.APPOINTMENT,
  APPROVAL_TYPES.DISMISSAL,
  APPROVAL_TYPES.CONTRACT_UPDATE,
]);

module.exports = {
  ROLES,
  EMPLOYEE_TYPES,
  CONTRACT_TYPES,
  CONTRACT_STATUS,
  LEAVE_TYPES,
  OVERTIME_RATES,
  OVERTIME_LIMITS,
  WORK_HOURS,
  LATE_PENALTIES,
  REFERENCE_SALARY,
  SI_HI_CAP,
  UI_CAP,
  INSURANCE_RATES,
  PIT,
  PROBATION_MAX_DAYS,
  NOTICE_DAYS,
  ANNUAL_LEAVE,
  DEFINITE_CONTRACT,
  APPROVAL_TYPES,
  SENSITIVE_TYPES,
};
