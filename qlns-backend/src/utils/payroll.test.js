const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculatePayslip, calcLatePenalty, calcPit } = require('./payroll');

describe('payroll 2026', () => {
  it('calculates BHXH + PIT for a 20tr official employee, full hours, no dependents', () => {
    const slip = calculatePayslip({
      basicSalary: 20000000,
      workingDays: 22,
      standardHours: 176,
      actualHours: 176,
      employeeType: 'official',
      contractType: 'indefinite',
      dependents: 0,
    });

    assert.equal(slip.gross, 20000000);
    assert.equal(slip.insurance.employee.bhxh, 1600000);
    assert.equal(slip.insurance.employee.bhyt, 300000);
    assert.equal(slip.insurance.employee.bhtn, 200000);
    assert.equal(slip.insurance.employee.total, 2100000);
    assert.equal(slip.taxableIncome, 2400000);
    assert.equal(slip.pit, 120000);
    assert.equal(slip.net, 17780000);
  });

  it('skips insurance on a separate probation contract', () => {
    const slip = calculatePayslip({
      basicSalary: 17000000,
      workingDays: 22,
      standardHours: 176,
      actualHours: 176,
      employeeType: 'probation',
      contractType: 'probation',
    });
    assert.equal(slip.insuranceEnrolled, false);
    assert.equal(slip.insurance.employee.total, 0);
  });

  it('exempts overtime from PIT base', () => {
    const withoutOt = calculatePayslip({
      basicSalary: 20000000,
      workingDays: 22,
      standardHours: 176,
      actualHours: 176,
      overtimePay: 0,
      employeeType: 'official',
      contractType: 'indefinite',
    });
    const withOt = calculatePayslip({
      basicSalary: 20000000,
      workingDays: 22,
      standardHours: 176,
      actualHours: 176,
      overtimePay: 1500000,
      employeeType: 'official',
      contractType: 'indefinite',
    });
    assert.equal(withOt.taxableIncome, withoutOt.taxableIncome);
    assert.equal(withOt.gross - withoutOt.gross, 1500000);
  });

  it('applies 5-bracket PIT', () => {
    assert.equal(calcPit(0), 0);
    assert.equal(calcPit(10000000), 500000);
    assert.equal(calcPit(30000000), 500000 + 20000000 * 0.1);
  });

  it('caps daily late penalty', () => {
    assert.equal(calcLatePenalty(10), 25000);
    assert.equal(calcLatePenalty(20), 50000);
    assert.equal(calcLatePenalty(90), 100000);
    assert.equal(calcLatePenalty(400), 100000);
  });
});
