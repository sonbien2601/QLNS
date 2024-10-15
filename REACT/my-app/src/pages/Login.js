import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      });

      // Store auth data
      const { token, userId, role, fullName, username } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('username', username);

      // Configure axios with the new token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Navigate based on role and reload the page
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
      window.location.reload();
    } catch (error) {
      console.error('Login error:', error);

      if (error.response) {
        setError(error.response.data.message || 'Đăng nhập thất bại, vui lòng kiểm tra thông tin đăng nhập');
      } else if (error.request) {
        setError('Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối Internet của bạn.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <LeftSection>
          <WelcomeText>Chào mừng trở lại!</WelcomeText>
          <Description>Đăng nhập để truy cập tài khoản của bạn và sử dụng dịch vụ của chúng tôi.</Description>
        </LeftSection>
        <RightSection>
          <FormTitle>Đăng nhập</FormTitle>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <StyledForm onSubmit={handleLogin}>
            <FormGroup>
              <Label>Email hoặc tên đăng nhập</Label>
              <Input
                type="text"
                placeholder="Email hoặc tên đăng nhập"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                placeholder="Mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>
            <SubmitButton type="submit">Đăng nhập</SubmitButton>
          </StyledForm>
          <ForgotPassword>
            <StyledLink href="/forgot-password">Quên mật khẩu?</StyledLink>
          </ForgotPassword>
        </RightSection>
      </ContentWrapper>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f8ff;
  padding: 20px;
`;

const ContentWrapper = styled.div`
  display: flex;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const LeftSection = styled.div`
  flex: 1;
  background: linear-gradient(180deg, #0953B8 19%, #042552 100%);
  padding: 40px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 1024px) {
    padding: 20px;
    text-align: center;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  img {
    width: 50px;
    height: 50px;
    object-fit: cover; 
    margin-right: 10px;
  }

  h1 {
    font-size: 24px;
    font-weight: bold;
  }
`;

const WelcomeText = styled.h2`
  font-size: 28px;
  color: white;
  margin-bottom: 20px;
`;

const Description = styled.p`
  font-size: 16px;
  color: white;
  line-height: 1.5;
`;

const RightSection = styled.div`
  flex: 1;
  padding: 40px;
  background-color: white;

  @media (max-width: 1024px) {
    padding: 20px;
  }
`;

const FormTitle = styled.h2`
  font-size: 32px;
  margin-bottom: 30px;
  color: #2c3e50;
  font-weight: 700;
  text-align: center;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const SubmitButton = styled.button`
  padding: 12px;
  font-size: 18px;
  color: white;
  background-color: ##00bfff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0099cc;
  }
`;

const ForgotPassword = styled.div`
  text-align: center;
  margin: 20px 0;
`;

const StyledLink = styled.a`
  color: #00bfff;
  text-decoration: none;
`;

const SocialLogin = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;


const ErrorMessage = styled.div`
  background-color: #fde8e8;
  color: #e74c3c;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

export default Login;