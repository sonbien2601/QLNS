import React from 'react';
import { Card, Descriptions, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../../auth/AuthContext';
import { ROLE_LABEL, vnd } from '../../theme/format';

export default function Profile() {
  const { user } = useAuth();
  return (
    <>
      <Typography.Title level={3}>Hồ sơ của tôi</Typography.Title>
      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã NV">{user.employeeCode || '—'}</Descriptions.Item>
          <Descriptions.Item label="Họ tên">{user.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="SĐT">{user.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="Vai trò"><Tag>{ROLE_LABEL[user.role]}</Tag></Descriptions.Item>
          <Descriptions.Item label="Vị trí">{user.positionName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Phòng">{user.department?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày vào">{user.hiredAt ? dayjs(user.hiredAt).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Lương CB">{vnd(user.basicSalary)}</Descriptions.Item>
          <Descriptions.Item label="Người phụ thuộc">{user.dependents || 0}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}
