const {
  INSURANCE_RATES,
  SI_HI_CAP,
  UI_CAP,
  PIT,
  OVERTIME_RATES,
  LATE_PENALTIES,
  EMPLOYEE_TYPES,
  CONTRACT_TYPES,
} = require('../config/constants');

function roundVnd(n) {
  return Math.round(Number(n) || 0);
}

function calcLatePenalty(lateMinutes) {
  if (!lateMinutes || lateMinutes <= 0) return 0;
  const level = LATE_PENALTIES.levels.find((l) => lateMinutes <= l.minutes);
  const penalty = LATE_PENALTIES.basePenalty * (level?.multiplier || 1);
  return Math.min(penalty, LATE_PENALTIES.maxDailyPenalty);
}

function calcOvertimePay(hourlyRate, hours, kind = 'weekday') {
  const rate = OVERTIME_RATES[kind] || OVERTIME_RATES.weekday;
  return roundVnd(hourlyRate * rate * hours);
}

function shouldEnrollInsurance({ employeeType, contractType }) {
  if (employeeType === EMPLOYEE_TYPES.PROBATION && contractType === CONTRACT_TYPES.PROBATION) {
    return false;
  }
  return true;
}

function calcInsurance(insuranceSalary, enrolled) {
  const zero = {
    employee: { bhxh: 0, bhyt: 0, bhtn: 0, total: 0 },
    employer: { bhxh: 0, bhyt: 0, bhtn: 0, total: 0 },
    siHiBase: 0,
    uiBase: 0,
  };
  if (!enrolled) return zero;

  const siHiBase = Math.min(Math.max(insuranceSalary, 0), SI_HI_CAP);
  const uiBase = Math.min(Math.max(insuranceSalary, 0), UI_CAP);
  const ee = INSURANCE_RATES.employee;
  const er = INSURANCE_RATES.employer;

  const employee = {
    bhxh: roundVnd(siHiBase * ee.bhxh),
    bhyt: roundVnd(siHiBase * ee.bhyt),
    bhtn: roundVnd(uiBase * ee.bhtn),
  };
  employee.total = employee.bhxh + employee.bhyt + employee.bhtn;

  const employer = {
    bhxh: roundVnd(siHiBase * er.bhxh),
    bhyt: roundVnd(siHiBase * er.bhyt),
    bhtn: roundVnd(uiBase * er.bhtn),
  };
  employer.total = employer.bhxh + employer.bhyt + employer.bhtn;

  return { employee, employer, siHiBase, uiBase };
}

function calcPit(taxableIncome) {
  let remaining = Math.max(0, taxableIncome);
  let tax = 0;
  let lower = 0;
  for (const bracket of PIT.brackets) {
    const slice = Math.min(remaining, bracket.upTo - lower);
    if (slice <= 0) break;
    tax += slice * bracket.rate;
    remaining -= slice;
    lower = bracket.upTo;
    if (remaining <= 0) break;
  }
  return roundVnd(tax);
}

/**
 * Tính phiếu lương tháng.
 *
 * Gross chịu BHXH: lương CB + phụ cấp thường xuyên (không gồm OT, thưởng đột xuất).
 * OT được miễn TNCN theo Luật 109/2025 (khoản làm thêm / làm đêm).
 */
function calculatePayslip(input) {
  const basicSalary = roundVnd(input.basicSalary);
  const allowances = roundVnd(input.allowances);
  const bonus = roundVnd(input.bonus);
  const taskBonus = roundVnd(input.taskBonus);
  const taskPenalty = roundVnd(input.taskPenalty);
  const latePenalty = roundVnd(input.latePenalty);
  const overtimePay = roundVnd(input.overtimePay);
  const workingDays = Number(input.workingDays) || 0;
  const standardHours = Number(input.standardHours) || workingDays * 8;
  const actualHours = Number(input.actualHours) || 0;
  const dependents = Number(input.dependents) || 0;

  const hourlyRate = standardHours > 0 ? basicSalary / standardHours : 0;
  const timePay = roundVnd(hourlyRate * actualHours);
  const gross = Math.max(
    0,
    timePay + allowances + bonus + taskBonus + overtimePay - taskPenalty - latePenalty
  );

  const enrolled = shouldEnrollInsurance({
    employeeType: input.employeeType,
    contractType: input.contractType,
  });
  const insuranceSalary = roundVnd(input.insuranceSalary ?? basicSalary);
  const insurance = calcInsurance(insuranceSalary, enrolled);

  const familyDeduction = PIT.personalDeduction + dependents * PIT.dependentDeduction;
  const taxableBase = Math.max(
    0,
    gross - overtimePay - insurance.employee.total - familyDeduction
  );
  const pit = calcPit(taxableBase);
  const net = Math.max(0, gross - insurance.employee.total - pit);
  const employerCost = gross + insurance.employer.total;

  return {
    basicSalary,
    allowances,
    bonus,
    taskBonus,
    taskPenalty,
    latePenalty,
    overtimePay,
    workingDays,
    standardHours,
    actualHours,
    hourlyRate: roundVnd(hourlyRate),
    timePay,
    gross,
    insurance,
    dependents,
    familyDeduction,
    taxableIncome: taxableBase,
    pit,
    net,
    employerCost,
    insuranceEnrolled: enrolled,
  };
}

module.exports = {
  roundVnd,
  calcLatePenalty,
  calcOvertimePay,
  shouldEnrollInsurance,
  calcInsurance,
  calcPit,
  calculatePayslip,
};
