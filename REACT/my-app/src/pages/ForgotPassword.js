import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password/check-email', {
        email
      });

      setUserId(response.data.userId);
      setIsAdmin(response.data.isAdmin);
      setSecurityQuestions(response.data.securityQuestions);
      setStep(2);

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra'
      });
    }
    setLoading(false);
  };

  const handleVerifyAnswers = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password/verify', {
        userId,
        isAdmin,
        answers,
        newPassword
      });

      await Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Mật khẩu đã được cập nhật',
        confirmButtonText: 'Đăng nhập ngay'
      });

      navigate('/login');

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra'
      });
    }
    setLoading(false);
  };

  return (
    <Container>
      <FormWrapper>
        <Title>Quên mật khẩu</Title>
        
        {step === 1 && (
          <>
            <Description>
              Nhập email của bạn để lấy lại mật khẩu
            </Description>
            <Input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleCheckEmail} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tiếp tục'}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Description>
              Trả lời các câu hỏi bảo mật và nhập mật khẩu mới
            </Description>
            {securityQuestions.map((q, index) => (
              <FormGroup key={q.id}>
                <Label>{q.question}</Label>
                <Input
                  type="text"
                  placeholder="Nhập câu trả lời"
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                />
              </FormGroup>
            ))}
            <FormGroup>
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Xác nhận mật khẩu</Label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormGroup>
            <Button onClick={handleVerifyAnswers} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </>
        )}

        <BackToLogin onClick={() => navigate('/login')}>
          Quay lại đăng nhập
        </BackToLogin>
      </FormWrapper>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f8ff;
  padding: 20px;
`;

const FormWrapper = styled.div`
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
`;

const Description = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 25px;
  font-size: 16px;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const BackToLogin = styled.button`
  display: block;
  width: fit-content;
  margin: 20px auto 0;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #3498db;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export default ForgotPassword;