import React, { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const HOME = {
  admin: '/app/dashboard',
  hr: '/app/dashboard',
  finance: '/app/dashboard',
  employee: '/app/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onFinish(values) {
    setError('');
    setLoading(true);
    try {
      const user = await login(values.login, values.password);
      nav(HOME[user.role] || '/app/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      background: '#F8FAFC',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0B1220 0%, #134E4A 100%)',
        color: '#fff',
        padding: 64,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <div style={{ letterSpacing: 3, fontSize: 12, opacity: 0.7 }}>QLNS · PEOPLE OPERATIONS</div>
        <Typography.Title style={{ color: '#fff', marginTop: 12, fontSize: 42, fontWeight: 700 }}>
          Quản trị nhân sự<br />đúng luật, đủ số.
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#CBD5E1', fontSize: 16, maxWidth: 460 }}>
          Chấm công 2 ca, phép năm, tăng ca trần BLLĐ, phiếu lương Gross–Net
          (BHXH 10.5% + TNCN 5 bậc 2026), luồng HR tạo / Admin duyệt.
        </Typography.Paragraph>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Card style={{ width: 420, borderRadius: 16 }} bodyStyle={{ padding: 32 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>Đăng nhập</Typography.Title>
          <Typography.Paragraph type="secondary">Dùng tài khoản do công ty cấp. Không tự đăng ký Admin.</Typography.Paragraph>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Form layout="vertical" onFinish={onFinish} initialValues={{ login: '', password: '' }}>
            <Form.Item name="login" label="Email hoặc tên đăng nhập" rules={[{ required: true }]}>
              <Input size="large" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password size="large" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Vào hệ thống
            </Button>
          </Form>
          <div style={{ marginTop: 16 }}>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
          <Card size="small" style={{ marginTop: 24, background: '#F8FAFC' }}>
            <Typography.Text type="secondary">Tài khoản demo · mật khẩu <b>Demo@12345</b></Typography.Text>
            <Space direction="vertical" size={0} style={{ display: 'block', marginTop: 8 }}>
              <div>admin · hr · finance</div>
              <div>an.pham (chính thức) · linh.do (thử việc)</div>
            </Space>
          </Card>
        </Card>
      </div>
    </div>
  );
}
