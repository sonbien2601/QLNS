import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { STATUS_COLOR, hoursLabel, vnd } from '../../theme/format';

export default function Attendance() {
  const { user } = useAuth();
  const isStaff = user.role === 'employee';
  const [month, setMonth] = useState(dayjs());
  const [rows, setRows] = useState([]);
  const [today, setToday] = useState(null);

  async function load() {
    const params = { month: month.month() + 1, year: month.year() };
    if (isStaff) {
      const [h, t] = await Promise.all([
        client.get('/attendance/history', { params }),
        client.get('/attendance/today'),
      ]);
      setRows(h.records);
      setToday(t.record);
    } else {
      const h = await client.get('/attendance/all', { params });
      setRows(h.records);
    }
  }
  useEffect(() => { load().catch((e) => message.error(e.message)); }, [month]);

  async function punch(kind) {
    try {
      await client.post(`/attendance/check-${kind}`);
      message.success('Đã ghi nhận');
      load();
    } catch (e) { message.error(e.message); }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Chấm công</Typography.Title>
        <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} />
      </Space>
      {isStaff && (
        <Card>
          <Space>
            <Button type="primary" onClick={() => punch('in')}>Check-in</Button>
            <Button onClick={() => punch('out')}>Check-out</Button>
            {today && <Tag color={STATUS_COLOR[today.status]}>{today.status}</Tag>}
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
            Ca sáng 08:00–12:00 · ca chiều 13:30–17:30 · đi muộn &gt; 15 phút bị phạt (nội quy).
          </Typography.Paragraph>
        </Card>
      )}
      <Card>
        <Table
          rowKey="_id"
          dataSource={rows}
          columns={[
            !isStaff && { title: 'Nhân viên', render: (_, r) => r.user?.fullName },
            { title: 'Ngày', dataIndex: 'date', render: (d) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Sáng vào', dataIndex: 'morningCheckIn', render: t },
            { title: 'Sáng ra', dataIndex: 'morningCheckOut', render: t },
            { title: 'Chiều vào', dataIndex: 'afternoonCheckIn', render: t },
            { title: 'Chiều ra', dataIndex: 'afternoonCheckOut', render: t },
            { title: 'Giờ công', dataIndex: 'dailyMinutes', render: hoursLabel },
            { title: 'Phạt muộn', dataIndex: 'latePenalty', render: vnd },
            { title: 'TT', dataIndex: 'status', render: (v) => <Tag color={STATUS_COLOR[v]}>{v}</Tag> },
          ].filter(Boolean)}
        />
      </Card>
    </Space>
  );
}

function t(d) {
  return d ? dayjs(d).format('HH:mm') : '—';
}
