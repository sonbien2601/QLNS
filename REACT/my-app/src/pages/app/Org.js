import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Table, Typography, message } from 'antd';
import client from '../../api/client';

export default function Org() {
  const [deps, setDeps] = useState([]);
  const [pos, setPos] = useState([]);
  const [open, setOpen] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    const [d, p] = await Promise.all([client.get('/org/departments'), client.get('/org/positions')]);
    setDeps(d.items);
    setPos(p.items);
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function submit(values) {
    try {
      if (open === 'dep') await client.post('/org/departments', values);
      else await client.post('/org/positions', values);
      message.success('Đã lưu');
      setOpen(null);
      form.resetFields();
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <>
      <Typography.Title level={3}>Cơ cấu tổ chức</Typography.Title>
      <Row gutter={16}>
        <Col span={10}>
          <Card title="Phòng ban" extra={<Button onClick={() => setOpen('dep')}>Thêm</Button>}>
            <Table rowKey="_id" dataSource={deps} pagination={false} columns={[
              { title: 'Mã', dataIndex: 'code', width: 80 },
              { title: 'Tên', dataIndex: 'name' },
            ]} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="Vị trí công việc" extra={<Button onClick={() => setOpen('pos')}>Thêm</Button>}>
            <Table rowKey="_id" dataSource={pos} pagination={false} columns={[
              { title: 'Vị trí', dataIndex: 'name' },
              { title: 'Phòng', render: (_, r) => r.department?.name },
              { title: 'Cấp', dataIndex: 'level' },
            ]} />
          </Card>
        </Col>
      </Row>
      <Modal title={open === 'dep' ? 'Phòng ban' : 'Vị trí'} open={Boolean(open)} onCancel={() => setOpen(null)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={submit}>
          {open === 'dep' ? (
            <>
              <Form.Item name="name" label="Tên" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="code" label="Mã" rules={[{ required: true }]}><Input /></Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="name" label="Tên vị trí" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="department" label="Phòng" rules={[{ required: true }]}>
                <Select options={deps.map((d) => ({ value: d._id, label: d.name }))} />
              </Form.Item>
              <Form.Item name="level" label="Cấp" initialValue="staff">
                <Select options={['staff', 'senior', 'lead', 'manager', 'director'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}
