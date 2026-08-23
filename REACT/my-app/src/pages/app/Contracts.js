import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { CONTRACT_LABEL, STATUS_COLOR, vnd } from '../../theme/format';

export default function Contracts() {
  const { user } = useAuth();
  const canEdit = user.role === 'admin' || user.role === 'hr';
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const data = await client.get('/contracts');
    setRows(data.contracts);
    if (canEdit) {
      const e = await client.get('/employees');
      setEmployees(e.users);
    }
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      await client.post('/contracts', {
        userId: values.userId,
        contractType: values.contractType,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        signedSalary: values.signedSalary,
      });
      message.success('Đã lưu hợp đồng');
      setOpen(false);
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Hợp đồng lao động</Typography.Title>
          <Typography.Text type="secondary">HĐ xác định thời hạn tối đa 36 tháng; lần thứ 3 phải chuyển không thời hạn (Đ.20).</Typography.Text>
        </div>
        {canEdit && <Button type="primary" onClick={() => setOpen(true)}>Ký hợp đồng</Button>}
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Loại', dataIndex: 'contractType', render: (v) => CONTRACT_LABEL[v] || v },
            { title: 'Bắt đầu', dataIndex: 'startDate', render: (d) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Kết thúc', dataIndex: 'endDate', render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—') },
            { title: 'Lương ký', dataIndex: 'signedSalary', render: vnd },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
          ]}
        />
      </Card>
      <Modal title="Hợp đồng mới" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="userId" label="Nhân viên" rules={[{ required: true }]}>
            <Select options={employees.map((e) => ({ value: e._id, label: `${e.employeeCode} · ${e.fullName}` }))} />
          </Form.Item>
          <Form.Item name="contractType" label="Loại" rules={[{ required: true }]}>
            <Select options={Object.entries(CONTRACT_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="startDate" label="Từ ngày" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="endDate" label="Đến ngày"><DatePicker /></Form.Item>
          <Form.Item name="signedSalary" label="Lương ghi trên HĐ" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
