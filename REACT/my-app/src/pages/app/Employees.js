import React, { useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { CONTRACT_LABEL, ROLE_LABEL, STATUS_COLOR, vnd } from '../../theme/format';

export default function Employees() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [org, setOrg] = useState({ departments: [], positions: [] });
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const canEdit = user.role === 'admin' || user.role === 'hr';

  async function load() {
    const [{ users }, deps, pos] = await Promise.all([
      client.get('/employees'),
      client.get('/org/departments'),
      client.get('/org/positions'),
    ]);
    setRows(users);
    setOrg({ departments: deps.items, positions: pos.items });
  }

  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function create(values) {
    try {
      const payload = {
        ...values,
        securityAnswers: [
          { question: 'Thành phố bạn sinh ra?', answer: values.answer || 'hanoi' },
          { question: 'Trường cấp 1?', answer: values.answer2 || 'hanoi' },
          { question: 'Biệt danh?', answer: values.answer3 || 'hanoi' },
        ],
      };
      delete payload.answer;
      delete payload.answer2;
      delete payload.answer3;
      const res = await client.post('/employees', payload);
      message.success(res.message || 'Đã tạo nhân viên');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) {
      message.error(e.message);
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Hồ sơ nhân sự</Typography.Title>
          <Typography.Text type="secondary">Một danh sách nhân sự duy nhất — không còn User / User2 tách rời.</Typography.Text>
        </div>
        {canEdit && <Button type="primary" onClick={() => setOpen(true)}>Thêm nhân viên</Button>}
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'Mã', dataIndex: 'employeeCode', width: 90 },
            { title: 'Họ tên', dataIndex: 'fullName' },
            { title: 'Vị trí', dataIndex: 'positionName' },
            { title: 'Phòng', render: (_, r) => r.department?.name || '—' },
            { title: 'Vai trò', dataIndex: 'role', render: (v) => ROLE_LABEL[v] },
            {
              title: 'Loại',
              dataIndex: 'employeeType',
              render: (v) => <Tag color={STATUS_COLOR[v]}>{v === 'official' ? 'Chính thức' : 'Thử việc'}</Tag>,
            },
            { title: 'Lương CB', dataIndex: 'basicSalary', render: vnd },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (v) => <Tag color={STATUS_COLOR[v]}>{v === 'active' ? 'Đang làm' : 'Nghỉ'}</Tag>,
            },
          ]}
        />
      </Card>
      <Modal title="Tiếp nhận nhân viên" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={720} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={create} initialValues={{ employeeType: 'probation', contractType: 'probation', gender: 'male' }}>
          <Space size={12} wrap>
            <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
            <Form.Item name="phoneNumber" label="SĐT" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="password" label="Mật khẩu tạm" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
            <Form.Item name="gender" label="Giới tính">
              <Select options={[{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }]} />
            </Form.Item>
            <Form.Item name="department" label="Phòng ban">
              <Select allowClear options={org.departments.map((d) => ({ value: d._id, label: d.name }))} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="positionName" label="Tên vị trí" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="employeeType" label="Loại NV">
              <Select options={[{ value: 'probation', label: 'Thử việc' }, { value: 'official', label: 'Chính thức' }]} />
            </Form.Item>
            <Form.Item name="contractType" label="Loại HĐ">
              <Select options={Object.entries(CONTRACT_LABEL).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="basicSalary" label="Lương CB" rules={[{ required: true }]}><InputNumber min={0} step={100000} style={{ width: 180 }} /></Form.Item>
            <Form.Item name="allowances" label="Phụ cấp"><InputNumber min={0} style={{ width: 180 }} /></Form.Item>
            <Form.Item name="dependents" label="Số NPT"><InputNumber min={0} max={10} /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
