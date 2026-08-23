const { Approval } = require('../../models');
const ApiError = require('../../utils/apiError');
const { ROLES, SENSITIVE_TYPES } = require('../../config/constants');
const employeeService = require('../employees/employee.service');
const workforceService = require('../workforce/workforce.service');
const payrollService = require('../payroll/payroll.service');
const contractService = require('../contracts/contract.service');

async function submitOrExecute({ type, payload, actor }) {
  if (actor.role === ROLES.HR && SENSITIVE_TYPES.has(type)) {
    const approval = await Approval.create({
      type,
      payload,
      requestedBy: actor._id,
      status: 'pending',
    });
    return {
      pendingApproval: true,
      message: 'Đã gửi yêu cầu đến Admin phê duyệt (tách lập kiểm soát — maker/checker)',
      approval,
    };
  }
  if (actor.role !== ROLES.ADMIN && SENSITIVE_TYPES.has(type) && actor.role !== ROLES.FINANCE) {
    throw new ApiError(403, 'Không có quyền thực hiện trực tiếp');
  }
  const result = await execute(type, payload, actor);
  return { pendingApproval: false, result };
}

async function execute(type, payload, actor) {
  switch (type) {
    case 'employee.create':
      return employeeService.createEmployee(payload, actor);
    case 'employee.update':
      return employeeService.updateEmployee(payload.userId, payload.updateData);
    case 'salary.update':
      return payrollService.updateSalary(payload);
    case 'appointment.create':
      return workforceService.executeAppointment(payload, actor);
    case 'dismissal.create':
      return workforceService.executeDismissal(payload, actor);
    case 'contract.update':
      if (payload.create || !payload.contractId) return contractService.create(payload);
      return contractService.updateContract(payload.contractId, payload.updateData);
    default:
      throw new ApiError(400, 'Loại phê duyệt không hỗ trợ');
  }
}

async function decide(approvalId, { status, adminResponse }, actor) {
  if (actor.role !== ROLES.ADMIN) throw new ApiError(403, 'Chỉ Admin được phê duyệt');
  const approval = await Approval.findById(approvalId);
  if (!approval) throw new ApiError(404, 'Không tìm thấy yêu cầu');
  if (approval.status !== 'pending') throw new ApiError(400, 'Yêu cầu đã được xử lý');
  if (!adminResponse) throw new ApiError(400, 'Cần ý kiến Admin khi phê duyệt / từ chối');

  approval.status = status;
  approval.adminResponse = adminResponse;
  approval.processedBy = actor._id;
  approval.processedAt = new Date();

  let result = null;
  if (status === 'approved') {
    result = await execute(approval.type, approval.payload, actor);
  }
  await approval.save();
  return { approval, result };
}

async function list({ mine, actor, status }) {
  const filter = {};
  if (status) filter.status = status;
  if (mine) filter.requestedBy = actor._id;
  return Approval.find(filter)
    .populate('requestedBy', 'fullName role positionName')
    .populate('processedBy', 'fullName')
    .sort({ createdAt: -1 });
}

module.exports = { submitOrExecute, decide, list, execute };
