import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR } from '../../theme/format';

export function Appointments() {
  return <ChangePage kind="appointments" title="Bổ nhiệm" hint="HR đề xuất, Admin duyệt rồi mới đổi vị trí. Nhân viên không tự xin bổ nhiệm." />;
}

export function Dismissals() {
  return <ChangePage kind="dismissals" title="Điều chuyển / miễn nhiệm" hint="Đổi vị trí (không phải sa thải). Sa thải / nghỉ việc nằm ở mục Nghỉ việc." />;
}

function ChangePage({ kind, title, hint }) {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const [list, emps] = await Promise.all([
      client.get(`/workforce/${kind}`),
      client.get('/employees'),
    ]);
    setRows(list.items);
    setEmployees(emps.users);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, [kind]);

  async function create(values) {
    try {
      const res = await client.post(`/workforce/${kind}`, {
        userId: values.userId,
        newPositionName: values.newPositionName,
        reason: values.reason,
        effectiveDate: values.effectiveDate.toISOString(),
      });
      message.success(res.message || 'Đã gửi');
      setOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>Tạo quyết định</Button>
      </Space>
      <Alert type="info" showIcon message={hint} />
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Từ', dataIndex: 'oldPositionName' },
            { title: 'Sang', dataIndex: 'newPositionName' },
            { title: 'Hiệu lực', dataIndex: 'effectiveDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
          ]}
        />
      </Card>
      <Modal title={title} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="userId" label="Nhân viên" rules={[{ required: true }]}>
            <Select options={employees.filter((e) => e.role === 'employee' || e.role === 'hr' || e.role === 'finance').map((e) => ({ value: e._id, label: e.fullName }))} />
          </Form.Item>
          <Form.Item name="newPositionName" label="Vị trí mới" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="effectiveDate" label="Ngày hiệu lực" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export function Resignations() {
  const { user } = useAuth();
  const canDecide = user.role === 'admin' || user.role === 'hr';
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const data = await client.get('/workforce/resignations');
    setRows(data.items);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      const item = await client.post('/workforce/resignations', {
        reason: values.reason,
        lastWorkingDay: values.lastWorkingDay.toISOString(),
        handoverNote: values.handoverNote,
      });
      const rec = item.item;
      message.info(rec.lawful
        ? `Đủ thời hạn báo trước (${rec.noticeDaysRequired} ngày)`
        : `Chưa đủ báo trước: cần ${rec.noticeDaysRequired} ngày, mới có ${rec.noticeDaysGiven} ngày`);
      setOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  }

  async function decide(id, status) {
    try {
      await client.patch(`/workforce/resignations/${id}`, { status, adminResponse: status === 'approved' ? 'Chấp thuận' : 'Từ chối' });
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Nghỉ việc</Typography.Title>
          <Typography.Text type="secondary">Báo trước 45 ngày (KXT), 30 ngày (XĐTH), 3 ngày (mùa vụ). Thử việc: không cần báo trước.</Typography.Text>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>Nộp đơn</Button>
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Ngày làm cuối', dataIndex: 'lastWorkingDay', render: (d) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Báo trước', render: (_, r) => `${r.noticeDaysGiven}/${r.noticeDaysRequired} ngày` },
            { title: 'Hợp pháp', dataIndex: 'lawful', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Đủ' : 'Thiếu'}</Tag> },
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
      <Modal title="Đơn nghỉ việc" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="lastWorkingDay" label="Ngày làm việc cuối" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Form.Item name="handoverNote" label="Bàn giao"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
