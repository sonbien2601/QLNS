const { Contract, User } = require('../../models');
const ApiError = require('../../utils/apiError');
const { CONTRACT_TYPES, CONTRACT_STATUS, DEFINITE_CONTRACT } = require('../../config/constants');

async function list(userId) {
  const filter = userId ? { user: userId } : {};
  return Contract.find(filter).populate('user', 'fullName employeeCode positionName').sort({ startDate: -1 });
}

async function create(payload) {
  const user = await User.findById(payload.userId);
  if (!user) throw new ApiError(404, 'Không tìm thấy nhân viên');

  if (payload.contractType === CONTRACT_TYPES.DEFINITE) {
    const previous = await Contract.countDocuments({
      user: user._id,
      contractType: CONTRACT_TYPES.DEFINITE,
      status: { $in: [CONTRACT_STATUS.ACTIVE, CONTRACT_STATUS.EXPIRED, CONTRACT_STATUS.TERMINATED] },
    });
    if (previous >= DEFINITE_CONTRACT.maxRenewals) {
      throw new ApiError(400, `Đã ký ${DEFINITE_CONTRACT.maxRenewals} HĐLĐ xác định thời hạn — lần tiếp theo phải là không xác định thời hạn (Đ.20 BLLĐ)`);
    }
    payload.definiteSequence = previous + 1;
  }

  await Contract.updateMany({ user: user._id, status: CONTRACT_STATUS.ACTIVE }, { status: CONTRACT_STATUS.EXPIRED });

  const contract = await Contract.create({
    user: user._id,
    contractType: payload.contractType,
    startDate: payload.startDate,
    endDate: payload.endDate || null,
    signedSalary: payload.signedSalary ?? user.basicSalary,
    note: payload.note || '',
    definiteSequence: payload.definiteSequence || 1,
    status: CONTRACT_STATUS.ACTIVE,
  });

  if (payload.contractType === CONTRACT_TYPES.PROBATION) {
    user.employeeType = 'probation';
  } else {
    user.employeeType = 'official';
  }
  await user.save();
  return contract;
}

async function updateContract(id, data) {
  const contract = await Contract.findById(id);
  if (!contract) throw new ApiError(404, 'Không tìm thấy hợp đồng');
  Object.assign(contract, data);
  await contract.save();
  return contract;
}

module.exports = { list, create, updateContract };
