import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR } from '../../theme/format';

export default function Approvals() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);

  async function load() {
    const data = await client.get('/approvals');
    setRows(data.items);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function decide(id, status) {
    try {
      await client.patch(`/approvals/${id}`, { status, adminResponse: status === 'approved' ? 'Phê duyệt' : 'Từ chối' });
      message.success('Đã xử lý');
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>Phê duyệt thao tác nhạy cảm</Typography.Title>
      <Typography.Text type="secondary">Maker/checker: HR tạo yêu cầu, Admin quyết định. Áp dụng tạo NV, đổi lương, HĐ, bổ nhiệm, điều chuyển.</Typography.Text>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Loại', dataIndex: 'type' },
            { title: 'Người gửi', render: (_, r) => r.requestedBy?.fullName },
            { title: 'Lúc', dataIndex: 'createdAt', render: (d) => dayjs(d).format('DD/MM HH:mm') },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
            user.role === 'admin' && {
              title: '',
              render: (_, r) => r.status === 'pending' && (
                <Space>
                  <Button size="small" type="primary" onClick={() => decide(r._id, 'approved')}>Duyệt</Button>
                  <Button size="small" danger onClick={() => decide(r._id, 'rejected')}>Từ chối</Button>
                </Space>
              ),
            },
          ].filter(Boolean)}
        />
      </Card>
    </Space>
  );
}
