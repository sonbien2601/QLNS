import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion, AnimatePresence } from 'framer-motion';

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
    employeeType: 'thử việc',
    gender: '', // New field for gender
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
    
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length <= 6 || !/\d/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập phải trên 6 ký tự và chứa ít nhất một số';
    }
    
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length <= 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải trên 6 ký tự và chứa ít nhất một ký tự đặc biệt';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.position.trim()) newErrors.position = 'Vui lòng nhập chức vụ';
    if (!formData.basicSalary) newErrors.basicSalary = 'Vui lòng nhập lương cơ bản';
    if (!formData.contractStart) newErrors.contractStart = 'Vui lòng nhập ngày bắt đầu hợp đồng';
    if (!formData.contractType) newErrors.contractType = 'Vui lòng chọn loại hợp đồng';
    if (!formData.employeeType) newErrors.employeeType = 'Vui lòng chọn loại nhân viên';
    if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính'; // New validation for gender

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
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
        employeeType: 'thử việc',
        gender: '',
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
      <ContentContainer
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FormContainer>
          <FormTitle
            as={motion.h2}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Thêm Nhân Viên Mới
          </FormTitle>
          <StyledForm onSubmit={handleSubmit}>
            <FormGrid>
              <AnimatePresence>
                {Object.entries(formData).map(([key, value], index) => (
                  <FormGroup
                    key={key}
                    as={motion.div}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Label htmlFor={key}>{getLabelText(key)}:</Label>
                    {key === 'contractType' || key === 'contractStatus' || key === 'employeeType' || key === 'gender' ? (
                      <Select
                        id={key}
                        name={key}
                        value={value}
                        onChange={handleChange}
                        $isInvalid={!!errors[key]}
                      >
                        {getOptions(key)}
                      </Select>
                    ) : (
                      <Input
                        type={getInputType(key)}
                        id={key}
                        name={key}
                        value={value}
                        onChange={handleChange}
                        $isInvalid={!!errors[key]}
                        placeholder={getPlaceholder(key)}
                      />
                    )}
                    {errors[key] && <ErrorMessage>{errors[key]}</ErrorMessage>}
                  </FormGroup>
                ))}
              </AnimatePresence>
            </FormGrid>

            <SubmitButton
              as={motion.button}
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Thêm Nhân Viên
            </SubmitButton>
          </StyledForm>
        </FormContainer>
      </ContentContainer>
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled(motion.div)`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const FormContainer = styled(motion.div)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled(motion.h2)`
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

const FormGroup = styled(motion.div)`
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

const SubmitButton = styled(motion.button)`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: center;

  &:hover {
    background-color: #2980b9;
  }
`;

// Helper functions
const getLabelText = (key) => {
  const labels = {
    fullName: 'Tên Nhân Viên',
    username: 'Tên đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    phoneNumber: 'Số điện thoại',
    position: 'Chức vụ',
    basicSalary: 'Lương cơ bản',
    contractStart: 'Ngày bắt đầu hợp đồng',
    contractEnd: 'Ngày kết thúc hợp đồng',
    contractType: 'Loại hợp đồng',
    contractStatus: 'Trạng thái hợp đồng',
    employeeType: 'Loại nhân viên',
    gender: 'Giới tính' // New label for gender
  };
  return labels[key] || key;
};

const getInputType = (key) => {
  const types = {
    email: 'email',
    password: 'password',
    confirmPassword: 'password',
    phoneNumber: 'tel',
    basicSalary: 'number',
    contractStart: 'date',
    contractEnd: 'date'
  };
  return types[key] || 'text';
};

const getPlaceholder = (key) => {
  const placeholders = {
    fullName: 'Nhập tên đầy đủ của nhân viên',
    username: 'Nhập tên đăng nhập',
    email: 'example@company.com',
    password: 'Nhập mật khẩu',
    confirmPassword: 'Nhập lại mật khẩu',
    phoneNumber: 'Ví dụ: 0123456789',
    position: 'Nhập chức vụ của nhân viên',
    basicSalary: 'Nhập lương cơ bản (VNĐ)'
  };
  return placeholders[key] || '';
};

const getOptions = (key) => {
  if (key === 'contractType') {
    return (
      <>
        <option value="">Chọn loại hợp đồng</option>
        <option value="fullTime">Toàn thời gian</option>
        <option value="partTime">Bán thời gian</option>
        <option value="temporary">Tạm thời</option>
      </>
    );
  } else if (key === 'contractStatus') {
    return (
      <>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Không hoạt động</option>
        <option value="expired">Đã hết hạn</option>
      </>
    );
  } else if (key === 'employeeType') {
    return (
      <>
        <option value="">Chọn loại nhân viên</option>
        <option value="thử việc">Thử việc</option>
        <option value="chính thức">Chính thức</option>
      </>
    );
  } else if (key === 'gender') {
    return (
      <>
        <option value="">Chọn giới tính</option>
        <option value="male">Nam</option>
        <option value="female">Nữ</option>
        <option value="other">Khác</option>
      </>
    );
  }
  return null;
};

export default AddEmployee;