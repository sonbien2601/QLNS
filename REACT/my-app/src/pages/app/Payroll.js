import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Descriptions, InputNumber, Modal, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR, vnd } from '../../theme/format';

export default function Payroll() {
  const { user } = useAuth();
  const isStaff = user.role === 'employee';
  const [month, setMonth] = useState(dayjs());
  const [rows, setRows] = useState([]);
  const [mine, setMine] = useState(null);
  const [edit, setEdit] = useState(null);

  async function load() {
    const params = { month: month.month() + 1, year: month.year() };
    if (isStaff) {
      const data = await client.get('/payroll/me', { params });
      setMine(data.salary);
    } else {
      const data = await client.get('/payroll', { params });
      setRows(data.salaries);
    }
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, [month]);

  async function saveEdit() {
    try {
      await client.put(`/payroll/${edit.user._id || edit.user}`, {
        month: month.month() + 1,
        year: month.year(),
        bonus: edit.bonus,
        allowances: edit.allowances,
        basicSalary: edit.basicSalary,
      });
      message.success('Đã cập nhật (HR sẽ chờ Admin duyệt nếu bạn là HR)');
      setEdit(null);
      load();
    } catch (e) { message.error(e.message); }
  }

  const snapOf = (r) => r.snapshot || {};

  if (isStaff) {
    const s = mine?.snapshot || {};
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>Phiếu lương</Typography.Title>
          <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} />
        </Space>
        <Card>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Lương theo giờ công">{vnd(s.timePay)}</Descriptions.Item>
            <Descriptions.Item label="Phụ cấp">{vnd(s.allowances)}</Descriptions.Item>
            <Descriptions.Item label="Thưởng / task">{vnd((s.bonus || 0) + (s.taskBonus || 0))}</Descriptions.Item>
            <Descriptions.Item label="Tăng ca (miễn TNCN)">{vnd(s.overtimePay)}</Descriptions.Item>
            <Descriptions.Item label="Phạt muộn / task">{vnd((s.latePenalty || 0) + (s.taskPenalty || 0))}</Descriptions.Item>
            <Descriptions.Item label="Tổng thu nhập (gross)">{vnd(s.gross)}</Descriptions.Item>
            <Descriptions.Item label="BHXH 8%">{vnd(s.insurance?.employee?.bhxh)}</Descriptions.Item>
            <Descriptions.Item label="BHYT 1.5%">{vnd(s.insurance?.employee?.bhyt)}</Descriptions.Item>
            <Descriptions.Item label="BHTN 1%">{vnd(s.insurance?.employee?.bhtn)}</Descriptions.Item>
            <Descriptions.Item label="Thuế TNCN">{vnd(s.pit)}</Descriptions.Item>
            <Descriptions.Item label="Thực lĩnh (net)"><b>{vnd(s.net)}</b></Descriptions.Item>
            <Descriptions.Item label="Chi phí NSDLĐ">{vnd(s.employerCost)}</Descriptions.Item>
          </Descriptions>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Giảm trừ bản thân 15,5 triệu + {mine?.snapshot?.dependents || 0} NPT × 6,2 triệu (NQ 110/2025).
            OT không tính vào thu nhập chịu thuế (Luật TNCN 2026).
          </Typography.Paragraph>
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Bảng lương</Typography.Title>
        <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} />
      </Space>
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Gross', render: (_, r) => vnd(snapOf(r).gross) },
            { title: 'BH NLĐ', render: (_, r) => vnd(snapOf(r).insurance?.employee?.total) },
            { title: 'TNCN', render: (_, r) => vnd(snapOf(r).pit) },
            { title: 'Net', render: (_, r) => vnd(snapOf(r).net) },
            { title: 'Chi phí CTY', render: (_, r) => vnd(snapOf(r).employerCost) },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
            user.role !== 'hr' && {
              title: '',
              render: (_, r) => <Button size="small" onClick={() => setEdit({ ...r, basicSalary: r.basicSalary, bonus: r.bonus, allowances: r.allowances })}>Sửa</Button>,
            },
          ].filter(Boolean)}
        />
      </Card>
      <Modal title="Điều chỉnh lương" open={Boolean(edit)} onCancel={() => setEdit(null)} onOk={saveEdit}>
        {edit && (
          <Space direction="vertical">
            <div>Lương CB <InputNumber value={edit.basicSalary} onChange={(v) => setEdit({ ...edit, basicSalary: v })} /></div>
            <div>Phụ cấp <InputNumber value={edit.allowances} onChange={(v) => setEdit({ ...edit, allowances: v })} /></div>
            <div>Thưởng <InputNumber value={edit.bonus} onChange={(v) => setEdit({ ...edit, bonus: v })} /></div>
          </Space>
        )}
      </Modal>
    </Space>
  );
}
