import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';

axios.defaults.baseURL = 'http://localhost:5000';

const Login = () => {
 const [login, setLogin] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [rememberMe, setRememberMe] = useState(false);
 const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const response = await axios.post('/api/auth/login', { login, password });
    const { token, userId, role, fullName, username } = response.data;
    
    // Debug log
    console.log('Login response:', response.data);
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);
    localStorage.setItem('fullName', fullName);
    localStorage.setItem('username', username);
    
    // Debug log
    console.log('Stored role:', localStorage.getItem('role'));
    
    switch(role) {
      case 'admin':
        navigate('/admin/overview-admin');
        break;
      case 'hr':
        navigate('/admin/overview-admin');
        break;
      case 'finance':
        navigate('/finance/overview-finance');
        break;
      case 'user':
        navigate('/user/overview-user');
        break;
      default:
        console.error('Unknown role:', role);
        setError('Lỗi phân quyền người dùng');
        break;
    }
     
   } catch (error) {
     console.error('Login error:', error);
     if (error.response?.data?.message) {
       setError(error.response.data.message);
     } else {
       setError('Lỗi đăng nhập, vui lòng thử lại sau');
     }
   }
 };

 // Giữ nguyên phần JSX và styling
 return (
   <PageContainer>
     <LoginForm onSubmit={handleLogin}>
       <Title>Đăng nhập</Title>
       <Subtitle>Chào mừng trở lại. Đăng nhập để bắt đầu làm việc.</Subtitle>
       {error && <ErrorMessage>{error}</ErrorMessage>}
       <InputGroup>
         <Label>Tên đăng nhập</Label>
         <Input
           type="text"
           value={login}
           onChange={(e) => setLogin(e.target.value)}
           required
           placeholder="Nhập tên đăng nhập hoặc email"
         />
       </InputGroup>
       <InputGroup>
         <Label>Mật khẩu</Label>
         <Input
           type="password"
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           required
           placeholder="Nhập mật khẩu"
         />
       </InputGroup>
       <RememberForgot>
         <RememberMeLabel>
           <HiddenCheckbox
             checked={rememberMe}
             onChange={(e) => setRememberMe(e.target.checked)}
           />
         </RememberMeLabel>
         <ForgotPassword href="/forgot-password">Quên mật khẩu?</ForgotPassword>
       </RememberForgot>
       <LoginButton type="submit">Đăng nhập</LoginButton>
       <SocialLogin>
         <GoogleButton>
           <FaGoogle /> Đăng nhập bằng Google
         </GoogleButton>
         <MicrosoftButton>
           <FaMicrosoft /> Đăng nhập bằng Microsoft
         </MicrosoftButton>
       </SocialLogin>
       <RegisterLink>
         Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
       </RegisterLink>
     </LoginForm>
     <ImageSection>
       <WelcomeContainer>
         <WelcomeTitle>Chào mừng trở lại</WelcomeTitle>
         <WelcomeSubtitle>với Hệ thống Quản lý Nhân sự</WelcomeSubtitle>
         <WelcomeDescription>
           Đăng nhập để bắt đầu quản lý và phát triển nguồn nhân lực của bạn.
         </WelcomeDescription>
       </WelcomeContainer>
     </ImageSection>
   </PageContainer>
 );
};

const ImageSection = styled.div`
 flex: 1;
 background: linear-gradient(180deg, #0953B8 19%, #042552 100%);
 display: flex;
 align-items: center;
 justify-content: center;
 padding: 40px;
`;

const WelcomeContainer = styled.div`
 font-size: 28px;
 margin-bottom: 20px;
 color: white;
`;

const WelcomeTitle = styled.h2`
  font-size: 36px;
  margin-bottom: 16px;
  color: white;
`;

const WelcomeSubtitle = styled.h3`
  font-size: 24px;
  margin-bottom: 24px;
`;

const WelcomeDescription = styled.p`
  font-size: 16px;
  line-height: 1.5;
  color: white;
`;


const PageContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const LoginForm = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 15%;
  background-color: white;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const Logo = styled.img`
  width: 50px;
  height: 60px;
`;

const LogoTitle = styled.h1`
  margin-left: 10px;
  font-size: 1.5rem;
  color: #2B91E8;
  font-weight: bold;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #2B91E8;
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 24px;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background-color: #f0f8ff;
`;

const RememberForgot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const RememberMeLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const CheckIcon = styled.svg`
  fill: none;
  stroke: white;
  stroke-width: 2px;
`;

const StyledCheckbox = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  background: ${props => props.checked ? '#2B91E8' : 'white'};
  border: 2px solid #2B91E8;
  border-radius: 3px;
  transition: all 150ms;
  margin-right: 8px;

  ${CheckIcon} {
    visibility: ${props => props.checked ? 'visible' : 'hidden'}
  }
`;

const ForgotPassword = styled.a`
  color: #2B91E8;
  text-decoration: none;
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #2B91E8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
`;

const SocialLogin = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SocialButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  margin: 0 8px;
  font-size: 14px;
  transition: background-color 0.3s;

  svg {
    margin-right: 8px;
    font-size: 18px;
  }

  &:hover {
    background-color: #f0f0f0;
  }
`;

const GoogleButton = styled(SocialButton)`
  margin-left: 0;
  color: #DB4437;
`;

const MicrosoftButton = styled(SocialButton)`
  margin-right: 0;
  color: #00a1f1;
`;


const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 16px;
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 14px;

  a {
    color: #2B91E8;
    text-decoration: none;
    font-weight: bold;

    &:hover {
      text-decoration: underline;
    }
  }
`;


export default Login;