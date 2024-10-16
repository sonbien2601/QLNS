import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    position: '',
    companyName: '',
    city: '',
    gender: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.length <= 6 || !/\d/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập phải trên 6 ký tự và chứa ít nhất một số';
    }

    if (!formData.fullName.trim()) newErrors.fullName = 'Họ và tên là bắt buộc';

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length <= 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải trên 6 ký tự và chứa ít nhất một ký tự đặc biệt';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    if (!formData.position) newErrors.position = 'Vui lòng chọn vị trí công việc';
    if (!formData.companyName.trim()) newErrors.companyName = 'Tên công ty là bắt buộc';
    if (!formData.city) newErrors.city = 'Vui lòng chọn thành phố';
    if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);

      await Swal.fire({
        title: 'Thành công!',
        text: `Đăng ký thành công với vai trò ${response.data.role}`,
        icon: 'success',
        confirmButtonText: 'Đăng nhập ngay'
      });

      navigate('/login');
    } catch (error) {
      Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <LeftSection>
          <WelcomeText>Chào mừng bạn đến với chúng tôi</WelcomeText>
          <Description>Hãy tạo tài khoản để bắt đầu sử dụng dịch vụ của chúng tôi.</Description>
        </LeftSection>
        <RightSection>
          <FormTitle>Đăng ký tài khoản</FormTitle>
          <StyledForm onSubmit={handleRegister}>
            <FormGrid>
              <FormGroup>
                <Label>Tên đăng nhập:</Label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập"
                  $hasError={!!errors.username}
                />
                {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Họ và tên:</Label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập tên đầy đủ của bạn"
                  $hasError={!!errors.fullName}
                />
                {errors.fullName && <ErrorMessage>{errors.fullName}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Email:</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@company.com"
                  $hasError={!!errors.email}
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Số điện thoại:</Label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Ví dụ: 0123456789"
                  $hasError={!!errors.phoneNumber}
                />
                {errors.phoneNumber && <ErrorMessage>{errors.phoneNumber}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Mật khẩu:</Label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  $hasError={!!errors.password}
                />
                {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Xác nhận mật khẩu:</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  $hasError={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Vị trí công việc:</Label>
                <Select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  $hasError={!!errors.position}
                >
                  <option value="">Chọn vị trí công việc</option>
                  <option value="developer">Nhà phát triển</option>
                  <option value="designer">Nhà thiết kế</option>
                  <option value="manager">Quản lý</option>
                </Select>
                {errors.position && <ErrorMessage>{errors.position}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Tên công ty:</Label>
                <Input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Nhập tên công ty của bạn"
                  $hasError={!!errors.companyName}
                />
                {errors.companyName && <ErrorMessage>{errors.companyName}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Tỉnh/Thành phố:</Label>
                <Select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  $hasError={!!errors.city}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  <option value="hanoi">Hà Nội</option>
                  <option value="hcm">Thành phố Hồ Chí Minh</option>
                  <option value="danang">Đà Nẵng</option>
                </Select>
                {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>Giới tính:</Label>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  $hasError={!!errors.gender}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </Select>
                {errors.gender && <ErrorMessage>{errors.gender}</ErrorMessage>}
              </FormGroup>
            </FormGrid>
            <SubmitButton type="submit">Đăng ký</SubmitButton>
          </StyledForm>
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
  width: 100%; // Đảm bảo container chiếm toàn bộ chiều rộng
  box-sizing: border-box; // Đảm bảo padding không làm tăng kích thước tổng thể
`;

const ContentWrapper = styled.div`
  display: flex;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1300px; // Tăng từ 1200px lên 1400px

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
    margin-right: 10px;
  }

  h1 {
    font-size: 24px;
    font-weight: bold;
  }
`;

const WelcomeText = styled.h2`
  font-size: 28px;
  margin-bottom: 20px;
  color: white;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.5;
  color: white;
`;

const RightSection = styled.div`
  flex: 2;
  padding: 40px;
  background-color: white;
  overflow-y: auto;
  max-height: 90vh;

  @media (max-width: 1024px) {
    padding: 20px;
  }
`;

const FormTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 5px;
  color: #555;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${props => props.$hasError ? '#e74c3c' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid ${props => props.$hasError ? '#e74c3c' : '#ddd'};
  border-radius: 4px;
  font-size: 14px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
`;

const SubmitButton = styled.button`
  background-color: ##00bfff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0099cc;
  }
`;

export default Register;