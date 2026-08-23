import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LEAVE_LABEL, STATUS_COLOR } from '../../theme/format';

export default function Leave() {
  const { user } = useAuth();
  const canDecide = user.role === 'admin' || user.role === 'hr';
  const [rows, setRows] = useState([]);
  const [balance, setBalance] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const [list, bal] = await Promise.all([
      client.get('/leave'),
      client.get('/leave/balance'),
    ]);
    setRows(list.items);
    setBalance(bal.balance);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      await client.post('/leave', {
        type: values.type,
        startDate: values.range[0].toISOString(),
        endDate: values.range[1].toISOString(),
        reason: values.reason,
      });
      message.success('Đã gửi đơn');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) { message.error(e.message); }
  }

  async function decide(id, status) {
    try {
      await client.patch(`/leave/${id}`, { status, adminResponse: status === 'approved' ? 'Đồng ý' : 'Từ chối' });
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Nghỉ phép</Typography.Title>
          <Typography.Text type="secondary">Phép năm = 12 ngày + 1 ngày / 5 năm thâm niên (Đ.113 BLLĐ).</Typography.Text>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>Tạo đơn</Button>
      </Space>
      {balance && (
        <Card>
          <Space size={48}>
            <Statistic title="Được hưởng" value={balance.entitled} suffix="ngày" />
            <Statistic title="Đã dùng" value={balance.used} />
            <Statistic title="Còn lại" value={Math.max(0, balance.entitled - balance.used)} />
          </Space>
        </Card>
      )}
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Loại', dataIndex: 'type', render: (v) => LEAVE_LABEL[v] },
            { title: 'Từ', dataIndex: 'startDate', render: (d) => dayjs(d).format('DD/MM') },
            { title: 'Đến', dataIndex: 'endDate', render: (d) => dayjs(d).format('DD/MM') },
            { title: 'Số ngày', dataIndex: 'days' },
            { title: 'Lý do', dataIndex: 'reason' },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
            canDecide && {
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
      <Modal title="Đơn nghỉ" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create} initialValues={{ type: 'annual' }}>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select options={Object.entries(LEAVE_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="range" label="Khoảng ngày" rules={[{ required: true }]}>
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
