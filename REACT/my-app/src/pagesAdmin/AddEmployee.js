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
    employeeType: 'Thử việc',
    contractType: '',
    contractStart: '',
    contractEnd: '',
    contractStatus: 'active',
    gender: '',
    // Thêm các trường câu hỏi bảo mật
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: '',
    securityQuestion3: '',
    securityAnswer3: ''
  });
  

  // Thêm danh sách câu hỏi bảo mật
const securityQuestions = [
  "Tên trường tiểu học đầu tiên của bạn là gì?",
  "Con vật đầu tiên bạn nuôi là gì?",
  "Họ và tên đệm của mẹ bạn là gì?",
  "Biệt danh thời thơ ấu của bạn là gì?",
  "Người bạn thân nhất thời phổ thông của bạn là ai?",
  "Món ăn yêu thích thời thơ ấu của bạn là gì?"
];

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate thông tin cơ bản
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập tên nhân viên';
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length <= 6 || !/\d/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập phải trên 6 ký tự và chứa ít nhất một số';
    }
  
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }
    }
  
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
    if (!formData.employeeType) newErrors.employeeType = 'Vui lòng chọn loại nhân viên';
    if (!formData.gender) newErrors.gender = 'Vui lòng chọn giới tính';
  
    // Validate thông tin hợp đồng cho nhân viên chính thức
    if (formData.employeeType === 'Chính thức') {
      if (!formData.contractType) {
        newErrors.contractType = 'Vui lòng chọn loại hợp đồng';
      }
      if (!formData.contractStart) {
        newErrors.contractStart = 'Vui lòng nhập ngày bắt đầu hợp đồng';
      }
      if (!formData.contractEnd) {
        newErrors.contractEnd = 'Vui lòng nhập ngày kết thúc hợp đồng';
      }
      if (formData.contractStart && formData.contractEnd) {
        const startDate = new Date(formData.contractStart);
        const endDate = new Date(formData.contractEnd);
        if (endDate <= startDate) {
          newErrors.contractEnd = 'Ngày kết thúc phải sau ngày bắt đầu';
        }
      }
    }
  
    // Validate câu hỏi bảo mật
    for (let i = 1; i <= 3; i++) {
      if (!formData[`securityQuestion${i}`]) {
        newErrors[`securityQuestion${i}`] = `Vui lòng chọn câu hỏi bảo mật ${i}`;
      }
      if (!formData[`securityAnswer${i}`]?.trim()) {
        newErrors[`securityAnswer${i}`] = `Vui lòng nhập câu trả lời cho câu hỏi ${i}`;
      }
    }
  
    // Kiểm tra câu hỏi trùng nhau
    const questions = [
      formData.securityQuestion1,
      formData.securityQuestion2,
      formData.securityQuestion3
    ].filter(q => q);
  
    if (questions.length > 0 && new Set(questions).size !== questions.length) {
      newErrors.securityQuestions = 'Các câu hỏi bảo mật không được trùng nhau';
    }
  
    // Validate định dạng số điện thoại
    const phoneRegex = /^[0-9]{10,11}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 số)';
    }
  
    // Validate lương cơ bản
    if (formData.basicSalary && formData.basicSalary <= 0) {
      newErrors.basicSalary = 'Lương cơ bản phải lớn hơn 0';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

// Sửa lại hàm handleChange để xử lý thay đổi employeeType
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prevState => ({
    ...prevState,
    [name]: value,
    ...(name === 'employeeType' && value === 'Thử việc' ? {
      contractType: '',
      contractStart: '',
      contractEnd: '',
      contractStatus: 'active'
    } : {})
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    const { confirmPassword, ...submitData } = formData;

    // Nếu là nhân viên thử việc, loại bỏ thông tin hợp đồng
    if (submitData.employeeType === 'Thử việc') {
      delete submitData.contractType;
      delete submitData.contractStart;
      delete submitData.contractEnd;
      delete submitData.contractStatus;
    }

    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:5000/api/auth/create-user', 
      submitData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Xử lý phản hồi thành công
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

    // Reset form
    setFormData({
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      position: '',
      basicSalary: '',
      employeeType: 'Thử việc',
      contractType: '',
      contractStart: '',
      contractEnd: '',
      contractStatus: 'active',
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
              {Object.entries(formData).map(([key, value], index) => {
                // Bỏ qua render cho câu hỏi bảo mật và các trường hợp đồng khi là nhân viên thử việc
                if (
                  key.startsWith('security') || 
                  (['contractType', 'contractStart', 'contractEnd', 'contractStatus'].includes(key) && 
                   formData.employeeType === 'Thử việc')
                ) {
                  return null;
                }

                return (
                  <FormGroup
                    key={key}
                    as={motion.div}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Label htmlFor={key}>{getLabelText(key)}:</Label>
                    {key === 'contractType' || 
                     key === 'contractStatus' || 
                     key === 'employeeType' || 
                     key === 'gender' ? (
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
                );
              })}
            </AnimatePresence>

            {/* Phần câu hỏi bảo mật */}
            <SecuritySection
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <SecurityTitle>Thiết lập câu hỏi bảo mật</SecurityTitle>
              <SecurityDescription>
                Câu hỏi bảo mật được sử dụng để xác thực khi khôi phục mật khẩu. 
                Vui lòng chọn 3 câu hỏi khác nhau và nhập câu trả lời tương ứng.
              </SecurityDescription>
              {errors.securityQuestions && (
                <ErrorMessage style={{ textAlign: 'center', marginBottom: '15px' }}>
                  {errors.securityQuestions}
                </ErrorMessage>
              )}
              <SecurityQuestionsContainer>
      {[1, 2, 3].map((num) => (
        <React.Fragment key={num}>
          <FormGroup>
            <Label>{getLabelText(`securityQuestion${num}`)}:</Label>
            <Select
              name={`securityQuestion${num}`}
              value={formData[`securityQuestion${num}`]}
              onChange={handleChange}
              $isInvalid={!!errors[`securityQuestion${num}`]}
            >
              <option value="">Chọn câu hỏi bảo mật</option>
              {SECURITY_QUESTIONS.map((question, index) => (
                <option key={index} value={question}>
                  {question}
                </option>
              ))}
            </Select>
            {errors[`securityQuestion${num}`] && (
              <ErrorMessage>{errors[`securityQuestion${num}`]}</ErrorMessage>
            )}
          </FormGroup>
                    <FormGroup>
                      <Label>{getLabelText(`securityAnswer${num}`)}:</Label>
                      <Input
                        type="text"
                        name={`securityAnswer${num}`}
                        value={formData[`securityAnswer${num}`]}
                        onChange={handleChange}
                        placeholder={`Nhập câu trả lời ${num}`}
                        $isInvalid={!!errors[`securityAnswer${num}`]}
                      />
                      {errors[`securityAnswer${num}`] && (
                        <ErrorMessage>{errors[`securityAnswer${num}`]}</ErrorMessage>
                      )}
                    </FormGroup>
                  </React.Fragment>
                ))}
              </SecurityQuestionsContainer>
            </SecuritySection>
          </FormGrid>

          <SubmitButton
            as={motion.button}
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
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

const SecuritySection = styled.div`
  grid-column: 1 / -1;
  background-color: #f8fafc;
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
  border: 1px solid #e2e8f0;
`;

const SecurityTitle = styled.h3`
  color: #2d3748;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
`;

const SecurityDescription = styled.p`
  color: #718096;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const SecurityQuestionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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
    gender: 'Giới tính',
    // Thêm labels mới cho câu hỏi bảo mật
    securityQuestion1: 'Câu hỏi bảo mật 1',
    securityAnswer1: 'Câu trả lời 1',
    securityQuestion2: 'Câu hỏi bảo mật 2',
    securityAnswer2: 'Câu trả lời 2',
    securityQuestion3: 'Câu hỏi bảo mật 3',
    securityAnswer3: 'Câu trả lời 3'
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

const SECURITY_QUESTIONS = [
  "Tên trường tiểu học đầu tiên của bạn là gì?",
  "Con vật đầu tiên bạn nuôi là gì?",
  "Họ và tên đệm của mẹ bạn là gì?",
  "Biệt danh thời thơ ấu của bạn là gì?",
  "Người bạn thân nhất thời phổ thông của bạn là ai?",
  "Món ăn yêu thích thời thơ ấu của bạn là gì?"
];

// Di chuyển securityQuestions ra khỏi component để có thể sử dụng ở mọi nơi

// Cập nhật hàm getOptions để sử dụng SECURITY_QUESTIONS
const getOptions = (key) => {
  if (key.startsWith('securityQuestion')) {
    return (
      <>
        <option value="">Chọn câu hỏi bảo mật</option>
        {SECURITY_QUESTIONS.map((question, index) => (
          <option key={index} value={question}>{question}</option>
        ))}
      </>
    );
  }
  // Giữ nguyên các options cũ...
  if (key === 'contractType') {
    return (
      <>
        <option value="">Chọn loại hợp đồng</option>
        <option value="Toàn thời gian">Toàn thời gian</option>
        <option value="Bán thời gian">Bán thời gian</option>
        <option value="Tạm thời">Tạm thời</option>
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
        <option value="Thử việc">Thử việc</option>
        <option value="Chính thức">Chính thức</option>
      </>
    );
  } else if (key === 'gender') {
    return (
      <>
        <option value="">Chọn giới tính</option>
        <option value="Nam">Nam</option>
        <option value="Nữ">Nữ</option>
        <option value="Khác">Khác</option>
      </>
    );
  }
  return null;
};

export default AddEmployee;