import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR, vnd } from '../../theme/format';

export default function Tasks() {
  const { user } = useAuth();
  const canCreate = user.role === 'admin' || user.role === 'hr';
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const data = await client.get('/tasks');
    setRows(data.items);
    if (canCreate) {
      const e = await client.get('/employees');
      setEmployees(e.users.filter((u) => u.role === 'employee'));
    }
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      await client.post('/tasks', { ...values, dueDate: values.dueDate.toISOString() });
      setOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  }

  async function complete(id) {
    try {
      await client.post(`/tasks/${id}/complete`);
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Công việc</Typography.Title>
        {canCreate && <Button type="primary" onClick={() => setOpen(true)}>Giao việc</Button>}
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Việc', dataIndex: 'title' },
            { title: 'Giao cho', render: (_, r) => r.assignedTo?.fullName },
            { title: 'Hạn', dataIndex: 'dueDate', render: (d) => dayjs(d).format('DD/MM') },
            { title: 'Thưởng', dataIndex: 'bonus', render: vnd },
            { title: 'Phạt trễ', dataIndex: 'penalty', render: vnd },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v] || 'blue'}>{v}</Tag> },
            {
              title: '',
              render: (_, r) => r.status !== 'completed' && String(r.assignedTo?._id || r.assignedTo) === String(user._id) && (
                <Button size="small" onClick={() => complete(r._id)}>Hoàn thành</Button>
              ),
            },
          ]}
        />
      </Card>
      <Modal title="Giao việc" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create} initialValues={{ bonus: 0, penalty: 0, priority: 'medium' }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="assignedTo" label="Nhân viên" rules={[{ required: true }]}>
            <Select options={employees.map((e) => ({ value: e._id, label: e.fullName }))} />
          </Form.Item>
          <Form.Item name="dueDate" label="Hạn" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="bonus" label="Thưởng đúng hạn"><InputNumber min={0} /></Form.Item>
          <Form.Item name="penalty" label="Phạt trễ hạn"><InputNumber min={0} /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
