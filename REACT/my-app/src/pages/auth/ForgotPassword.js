import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function checkEmail({ email }) {
    setError('');
    setLoading(true);
    try {
      const data = await client.post('/auth/forgot-password/check-email', { email });
      setMeta(data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(values) {
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/forgot-password/verify', {
        userId: meta.userId,
        answers: meta.questions.map((_, i) => values[`a${i}`]),
        newPassword: values.newPassword,
      });
      nav('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F6F9' }}>
      <Card style={{ width: 440, borderRadius: 16 }}>
        <Typography.Title level={3}>Khôi phục mật khẩu</Typography.Title>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        {step === 1 ? (
          <Form layout="vertical" onFinish={checkEmail}>
            <Form.Item name="email" label="Email công ty" rules={[{ required: true, type: 'email' }]}>
              <Input size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Tiếp tục</Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={verify}>
            {meta.questions.map((q, i) => (
              <Form.Item key={q.id} name={`a${i}`} label={q.question} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            ))}
            <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, min: 8 }]}>
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Đặt lại mật khẩu</Button>
          </Form>
        )}
        <div style={{ marginTop: 16 }}><Link to="/login">Quay lại đăng nhập</Link></div>
      </Card>
    </div>
  );
}
