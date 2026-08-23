export const vnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const hoursLabel = (minutes) => {
  const m = Number(minutes) || 0;
  return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
};

export const ROLE_LABEL = {
  admin: 'Admin',
  hr: 'Nhân sự',
  finance: 'Tài chính',
  employee: 'Nhân viên',
};

export const CONTRACT_LABEL = {
  indefinite: 'Không xác định thời hạn',
  definite: 'Xác định thời hạn',
  seasonal: 'Mùa vụ / dưới 12 tháng',
  probation: 'Thử việc',
};

export const LEAVE_LABEL = {
  annual: 'Phép năm',
  sick: 'Ốm',
  unpaid: 'Không lương',
  marriage: 'Kết hôn',
  bereavement: 'Tang',
  maternity: 'Thai sản',
};

export const STATUS_COLOR = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
  active: 'green',
  inactive: 'default',
  draft: 'default',
  confirmed: 'blue',
  paid: 'green',
  present: 'green',
  late: 'orange',
  leave: 'purple',
  official: 'blue',
  probation: 'gold',
};
