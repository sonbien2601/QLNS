import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Tag, Button, Space, message } from 'antd';
import { useAuth } from '../../auth/AuthContext';
import client from '../../api/client';
import { hoursLabel, vnd } from '../../theme/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [today, setToday] = useState(null);

  async function load() {
    const d = await client.get('/dashboard');
    setData(d);
    if (user.role === 'employee') {
      const t = await client.get('/attendance/today');
      setToday(t.record);
    }
  }

  useEffect(() => { load().catch((e) => message.error(e.message)); }, []);

  async function punch(kind) {
    try {
      await client.post(`/attendance/check-${kind}`);
      message.success(kind === 'in' ? 'Đã check-in' : 'Đã check-out');
      load();
    } catch (e) {
      message.error(e.message);
    }
  }

  if (user.role === 'employee') {
    const snap = data?.salary?.snapshot || {};
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Xin chào, {user.fullName}</Typography.Title>
        <Row gutter={16}>
          <Col span={8}><Card><Statistic title="Thực lĩnh tháng này" value={snap.net || 0} formatter={(v) => vnd(v)} /></Card></Col>
          <Col span={8}><Card><Statistic title="Giờ công" value={hoursLabel(data?.attendanceSummary?.minutes)} /></Card></Col>
          <Col span={8}><Card><Statistic title="Đi muộn" value={data?.attendanceSummary?.late || 0} suffix="ngày" /></Card></Col>
        </Row>
        <Card title="Chấm công hôm nay">
          <Space>
            <Button type="primary" size="large" onClick={() => punch('in')}>Check-in</Button>
            <Button size="large" onClick={() => punch('out')}>Check-out</Button>
            {today && <Tag color={today.status === 'late' ? 'orange' : 'green'}>{today.status}</Tag>}
          </Space>
          {today && (
            <div style={{ marginTop: 12, color: '#64748B' }}>
              Sáng {fmt(today.morningCheckIn)} – {fmt(today.morningCheckOut)} ·
              Chiều {fmt(today.afternoonCheckIn)} – {fmt(today.afternoonCheckOut)}
            </div>
          )}
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>Bảng điều khiển</Typography.Title>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Nhân sự đang làm" value={data?.headcount || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Chờ phê duyệt" value={data?.pendingApprovals || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Đơn phép chờ" value={data?.pendingLeaves || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Chi phí lương (gross+BH NSDLĐ)" value={data?.payrollCost || 0} formatter={(v) => vnd(v)} /></Card></Col>
      </Row>
      <Card title="Ghi chú vận hành">
        <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
          <li>HR tạo nhân sự / bổ nhiệm / điều lương — Admin phê duyệt (tách lập kiểm soát).</li>
          <li>Tài chính chốt phiếu lương; nhân viên thử việc HĐ riêng không đóng BHXH.</li>
          <li>Tăng ca: tối đa 4h/ngày, 40h/tháng, 200h/năm · hệ số 150/200/300%.</li>
        </ul>
      </Card>
    </Space>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
}
