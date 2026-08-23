import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR, vnd } from '../../theme/format';

export default function Overtime() {
  const { user } = useAuth();
  const canDecide = user.role === 'admin' || user.role === 'hr';
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const data = await client.get('/overtime');
    setRows(data.items);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      await client.post('/overtime', { ...values, date: values.date.toISOString() });
      message.success('Đã gửi phiếu tăng ca');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) { message.error(e.message); }
  }

  async function decide(id, status) {
    try {
      await client.patch(`/overtime/${id}`, { status });
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Tăng ca</Typography.Title>
          <Typography.Text type="secondary">Đ.107: tối đa 4h/ngày · 40h/tháng · 200h/năm. Đ.98: 150% / 200% / 300%.</Typography.Text>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>Đăng ký tăng ca</Button>
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Ngày', dataIndex: 'date', render: (d) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Giờ', dataIndex: 'hours' },
            { title: 'Loại', dataIndex: 'kind' },
            { title: 'Thành tiền', dataIndex: 'payAmount', render: vnd },
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
      <Modal title="Phiếu tăng ca" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create} initialValues={{ hours: 1, kind: 'weekday' }}>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="hours" label="Số giờ (≤ 4)" rules={[{ required: true }]}><InputNumber min={0.5} max={4} step={0.5} /></Form.Item>
          <Form.Item name="kind" label="Loại">
            <Select options={[
              { value: 'weekday', label: 'Ngày thường 150%' },
              { value: 'weekend', label: 'Cuối tuần 200%' },
              { value: 'holiday', label: 'Lễ/Tết 300%' },
            ]} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
