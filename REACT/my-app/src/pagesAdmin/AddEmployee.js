import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    position: '',
    basicSalary: '',
    contractStart: '',
    contractEnd: '',
    contractType: '',
    contractStatus: 'active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập tên nhân viên';
    if (!formData.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.position.trim()) newErrors.position = 'Vui lòng nhập chức vụ';
    if (!formData.basicSalary) newErrors.basicSalary = 'Vui lòng nhập lương cơ bản';
    if (!formData.contractStart) newErrors.contractStart = 'Vui lòng nhập ngày bắt đầu hợp đồng';
    if (!formData.contractType) newErrors.contractType = 'Vui lòng chọn loại hợp đồng';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/auth/create-user', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Tạo tài khoản thành công:', response.data);

      // Cập nhật token mới nếu server trả về
      if (response.data.newToken) {
        localStorage.setItem('token', response.data.newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.newToken}`;
      }

      MySwal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Tạo tài khoản nhân viên mới thành công.',
        confirmButtonColor: '#3085d6',
      });
      
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        position: '',
        basicSalary: '',
        contractStart: '',
        contractEnd: '',
        contractType: '',
        contractStatus: 'active',
      });
      setErrors({});
    } catch (error) {
      console.error('Lỗi khi tạo tài khoản:', error);
      let errorMessage = 'Tạo tài khoản thất bại, vui lòng thử lại.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonColor: '#d33',
      });
    }
  };

  return (
    <PageContainer>
      <NavigationAdmin />
      <ContentContainer>
        <FormContainer>
          <FormTitle>Thêm Nhân Viên Mới</FormTitle>
          <StyledForm onSubmit={handleSubmit}>
            <FormGrid>
              <FormGroup>
                <Label>Tên Nhân Viên:</Label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  $isInvalid={!!errors.fullName}
                  placeholder="Nhập tên đầy đủ của nhân viên"
                />
                {errors.fullName && <ErrorMessage>{errors.fullName}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Tên đăng nhập:</Label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  $isInvalid={!!errors.username}
                  placeholder="Nhập tên đăng nhập"
                />
                {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Email:</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  $isInvalid={!!errors.email}
                  placeholder="example@company.com"
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Mật khẩu:</Label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  $isInvalid={!!errors.password}
                  placeholder="Nhập mật khẩu"
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
                  $isInvalid={!!errors.confirmPassword}
                  placeholder="Nhập lại mật khẩu"
                />
                {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Số điện thoại:</Label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  $isInvalid={!!errors.phoneNumber}
                  placeholder="Ví dụ: 0123456789"
                />
                {errors.phoneNumber && <ErrorMessage>{errors.phoneNumber}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Chức vụ:</Label>
                <Input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  $isInvalid={!!errors.position}
                  placeholder="Nhập chức vụ của nhân viên"
                />
                {errors.position && <ErrorMessage>{errors.position}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Lương cơ bản:</Label>
                <Input
                  type="number"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleChange}
                  $isInvalid={!!errors.basicSalary}
                  placeholder="Nhập lương cơ bản (VNĐ)"
                />
                {errors.basicSalary && <ErrorMessage>{errors.basicSalary}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Ngày bắt đầu hợp đồng:</Label>
                <Input
                  type="date"
                  name="contractStart"
                  value={formData.contractStart}
                  onChange={handleChange}
                  $isInvalid={!!errors.contractStart}
                />
                {errors.contractStart && <ErrorMessage>{errors.contractStart}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Ngày kết thúc hợp đồng:</Label>
                <Input
                  type="date"
                  name="contractEnd"
                  value={formData.contractEnd}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label>Loại hợp đồng:</Label>
                <Select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  $isInvalid={!!errors.contractType}
                >
                  <option value="">Chọn loại hợp đồng</option>
                  <option value="fullTime">Toàn thời gian</option>
                  <option value="partTime">Bán thời gian</option>
                  <option value="temporary">Tạm thời</option>
                </Select>
                {errors.contractType && <ErrorMessage>{errors.contractType}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>Trạng thái hợp đồng:</Label>
                <Select
                  name="contractStatus"
                  value={formData.contractStatus}
                  onChange={handleChange}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="expired">Đã hết hạn</option>
                </Select>
              </FormGroup>
            </FormGrid>

            <SubmitButton type="submit">Thêm Nhân Viên</SubmitButton>
          </StyledForm>
        </FormContainer>
      </ContentContainer>
    </PageContainer>
  );
};

// Styled components (cập nhật)
const PageContainer = styled.div`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const FormContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

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
  margin-bottom: 8px;
  color: #34495e;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${props => props.$isInvalid ? '#e74c3c' : '#ced4da'};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid ${props => props.$isInvalid ? '#e74c3c' : '#ced4da'};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  align-self: center;

  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default AddEmployee