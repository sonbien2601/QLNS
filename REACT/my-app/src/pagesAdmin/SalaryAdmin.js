import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import styled from 'styled-components';

// Styled Components


const MonthYearSelector = styled(motion.div)`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const StyledSelect = styled.select`
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  min-width: 120px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const MonthlyStatCard = styled(motion.div)`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  span:first-child {
    color: #64748b;
    font-size: 0.875rem;
  }

  span:last-child {
    color: #0f172a;
    font-weight: 600;
    font-size: 1.125rem;
  }
`;

const PageContainer = styled(motion.div)`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled(motion.div)`
  padding: 20px;
  width: 95%;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
`;

const Title = styled(motion.h2)`
  font-size: 32px;
  margin-bottom: 30px;
  color: #2c3e50;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SubTitle = styled(motion.h3)`
  font-size: 24px;
  margin-top: 40px;
  margin-bottom: 20px;
  color: #34495e;
  font-weight: 600;
`;

const SalaryForm = styled(motion.div)`
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #2c3e50;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ddd;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background-color: #3498db;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const CancelButton = styled(Button)`
  background-color: #e74c3c;
  margin-left: 10px;

  &:hover {
    background-color: #c0392b;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const Table = styled(motion.table)`
  width: 100%;
  min-width: 1200px; // Đảm bảo bảng không bị vỡ khi co nhỏ
  border-collapse: separate;
  border-spacing: 0;
  background-color: white;
`;

const Th = styled.th`
  background-color: #34495e;
  color: #ffffff;
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  
  &:first-child {
    border-top-left-radius: 8px;
    padding-left: 20px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
    padding-right: 20px;
  }
`;

const Tr = styled(motion.tr)`
  transition: all 0.3s ease;

  &:hover {
    background-color: #f8fafc;
  }
`;

const Td = styled.td`
  padding: 16px;
  vertical-align: middle;
  border-bottom: 1px solid #ecf0f1;
  color: #2c3e50;
  font-size: 14px;

  &:first-child {
    padding-left: 20px;
  }

  &:last-child {
    padding-right: 20px;
  }
`;

const ActionButton = styled(motion.button)`
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background-color: #3498db;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const DeleteButton = styled(ActionButton)`
  background-color: #e74c3c;

  &:hover {
    background-color: #c0392b;
  }
`;

const FeedbackButton = styled(ActionButton)`
  background-color: #2ecc71;

  &:hover {
    background-color: #27ae60;
  }
`;

const FeedbackSection = styled(motion.div)`
  margin-top: 40px;
  background-color: #f8fafc;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FeedbackList = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FeedbackItem = styled(motion.div)`
  padding: 16px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const AdminFeedback = styled(FeedbackItem)`
  background-color: #e8f5e9;
  border-left: 4px solid #27ae60;
`;

const UserFeedback = styled(FeedbackItem)`
  background-color: #e3f2fd;
  border-left: 4px solid #3498db;
`;

const FeedbackForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Textarea = styled.textarea`
  padding: 12px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

// TaskReward Styles
const TaskRewardStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
  },
  label: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
  },
  bonus: {
    color: '#22c55e',
    fontWeight: '600',
  },
  penalty: {
    color: '#ef4444',
    fontWeight: '600',
  },
  total: {
    borderTop: '1px dashed #e2e8f0',
    marginTop: '8px',
    paddingTop: '8px',
    fontWeight: '600',
  },
};
const SalaryBreakdownCell = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const BreakdownItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TaskRewardCell = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const SalaryInfoRow = styled.div`
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #edf2f7;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-size: 14px;
`;

const InfoValue = styled.span`
  font-weight: 600;
  ${props => props.positive && `color: #22c55e;`}
  ${props => props.negative && `color: #ef4444;`}
`;

const RewardSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;



const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const parseCurrency = (value) => {
  return parseInt(value.replace(/[^\d]/g, ''), 10);
};

const TaskRewardInfo = ({ salary }) => {
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <RewardSection>
      <SalaryInfoRow>
        <InfoLabel>Tasks hoàn thành:</InfoLabel>
        <InfoValue>{salary.completedTasks || 0} tasks</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Thưởng hoàn thành đúng hạn:</InfoLabel>
        <InfoValue positive>+{formatCurrency(salary.taskBonus || 0)}</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Phạt trễ deadline:</InfoLabel>
        <InfoValue negative>-{formatCurrency(salary.taskPenalty || 0)}</InfoValue>
      </SalaryInfoRow>
    </RewardSection>
  );
};

const SalaryDetailInfo = ({ salary }) => {
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Tính lương theo giờ
  const hourlyRate = salary.basicSalary / (salary.standardWorkHours || 1); // Lương giờ = Lương cơ bản / Số giờ chuẩn
  const baseHourlyPay = hourlyRate * (salary.actualWorkHours || 0); // Lương theo giờ làm việc = Lương giờ * Số giờ làm việc thực tế
  
  // Tính tổng lương
  const totalSalary = baseHourlyPay + // Lương theo giờ làm việc
                     (salary.bonus || 0) + // Thưởng cơ bản
                     (salary.taskBonus || 0) - // Thưởng task
                     (salary.taskPenalty || 0); // Trừ phạt task

  return (
    <RewardSection>
      <SalaryInfoRow>
        <InfoLabel>Lương theo giờ:</InfoLabel>
        <InfoValue>{formatCurrency(hourlyRate)}/giờ</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Lương theo giờ làm việc:</InfoLabel>
        <InfoValue>{formatCurrency(baseHourlyPay)}</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Thưởng cơ bản:</InfoLabel>
        <InfoValue positive>+{formatCurrency(salary.bonus || 0)}</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Thưởng task:</InfoLabel>
        <InfoValue positive>+{formatCurrency(salary.taskBonus || 0)}</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow>
        <InfoLabel>Phạt task:</InfoLabel>
        <InfoValue negative>-{formatCurrency(salary.taskPenalty || 0)}</InfoValue>
      </SalaryInfoRow>
      <SalaryInfoRow style={{ backgroundColor: '#e3f2fd', marginTop: '8px', borderRadius: '6px' }}>
        <InfoLabel style={{ fontWeight: 'bold' }}>Tổng lương:</InfoLabel>
        <InfoValue>{formatCurrency(totalSalary)}</InfoValue>
      </SalaryInfoRow>
    </RewardSection>
  );
};

const formatWorkHours = (hours) => {
  if (hours === undefined || hours === null) return 'N/A';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours} giờ ${minutes} phút`;
};

// Component
const SalaryAdmin = () => {
  // States
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [currentMonth, setCurrentMonth] = useState(moment().month() + 1);
  const [currentYear, setCurrentYear] = useState(moment().year());
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    basicSalary: '',
    bonus: '',
    month: currentMonth,
    year: currentYear
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // API Calls
  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/salary', {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: currentMonth, year: currentYear }
      });

      setSalaries(response.data.salaries.map(salary => ({
        ...salary,
        fullName: salary.userId?.fullName || salary.fullName,
        position: salary.userId?.position || salary.position
      })));
      setMonthlyStats(response.data.summary);

    } catch (error) {
      console.error('Lỗi chi tiết khi lấy dữ liệu lương:', error);
      setError(`Không thể lấy dữ liệu lương: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.users);
    } catch (error) {
      setError(`Không thể lấy danh sách nhân viên: ${error.message}`);
    }
  }, []);

  const fetchAllFeedbacks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = response.data.users;
      const feedbackPromises = users.map(user =>
        axios.get(`http://localhost:5000/api/auth/feedback-salary/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const feedbackResponses = await Promise.all(feedbackPromises);
      const allFeedbacks = {};
      feedbackResponses.forEach((response, index) => {
        allFeedbacks[users[index]._id] = response.data.feedbacks;
      });
      setFeedbacks(allFeedbacks);
    } catch (error) {
      setError(`Không thể lấy feedback: ${error.message}`);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
    fetchAllFeedbacks();
  }, [fetchSalaries, fetchEmployees, fetchAllFeedbacks]);

  // Event Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'basicSalary' || name === 'bonus') {
      setFormData({ ...formData, [name]: formatCurrency(parseCurrency(value)) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === 'userId') {
      const selectedEmployee = employees.find(emp => emp._id === value);
      if (selectedEmployee) {
        setFormData(prevState => ({
          ...prevState,
          userId: value,
          basicSalary: formatCurrency(selectedEmployee.basicSalary || 0)
        }));
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userId = selectedEmployee ? selectedEmployee.userId._id : formData.userId;
      const submissionData = {
        ...formData,
        basicSalary: parseCurrency(formData.basicSalary),
        bonus: parseCurrency(formData.bonus),
        month: currentMonth,
        year: currentYear
      };

      await axios.post(`http://localhost:5000/api/auth/salary/${userId}`, submissionData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchSalaries();
      setSelectedEmployee(null);
      setFormData({ userId: '', basicSalary: '', bonus: '', month: currentMonth, year: currentYear });

      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Đã cập nhật thông tin lương.',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      setError(`Không thể cập nhật hoặc tạo mới lương: ${error.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể cập nhật hoặc tạo mới lương. Vui lòng thử lại sau.',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn sẽ không thể hoàn tác hành động này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Có, xóa nó!',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/auth/salary/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: currentMonth, year: currentYear }
        });
        fetchSalaries();
        Swal.fire(
          'Đã xóa!',
          'Thông tin lương đã được xóa.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error deleting salary:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể xóa thông tin lương. Vui lòng thử lại sau.',
      });
    }
  };

  const handleUpdateClick = (salary) => {
    setSelectedEmployee(salary);
    setFormData({
      userId: salary.userId._id,
      basicSalary: formatCurrency(salary.basicSalary),
      bonus: formatCurrency(salary.bonus),
      month: currentMonth,
      year: currentYear
    });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/feedback-salary',
        { 
          message: newFeedbackMessage, 
          userId: selectedUserForFeedback,
          month: currentMonth,
          year: currentYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewFeedbackMessage('');
      fetchAllFeedbacks();
      Swal.fire({
        icon: 'success',
        title: 'Gửi feedback thành công!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể gửi feedback. Vui lòng thử lại sau.',
      });
    }
  };

  // Render Components
  const renderMonthlyStats = () => (
    <MonthlyStatCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <SubTitle>Thống kê tháng {currentMonth}/{currentYear}</SubTitle>
      <StatGrid>
        <StatItem>
          <span>Tổng nhân viên</span>
          <span>{monthlyStats?.totalEmployees || 0}</span>
        </StatItem>
        <StatItem>
          <span>Tổng giờ làm việc</span>
          <span>{formatWorkHours(monthlyStats?.totalWorkHours || 0)}</span>
        </StatItem>
        <StatItem>
          <span>Tổng lương chi trả</span>
          <span>{formatCurrency(monthlyStats?.totalSalaryPaid || 0)}</span>
        </StatItem>
        <StatItem>
          <span>Trung bình giờ làm việc</span>
          <span>{formatWorkHours(monthlyStats?.averageWorkHours || 0)}</span>
        </StatItem>
      </StatGrid>
    </MonthlyStatCard>
  );

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <Title>Đang tải dữ liệu...</Title>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <Title>Lỗi: {error}</Title>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <NavigationAdmin />
      <ContentContainer>
        <Title>Quản lý lương nhân viên</Title>

        <MonthYearSelector>
          <StyledSelect
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </StyledSelect>
          <StyledSelect
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={currentYear - 2 + i} value={currentYear - 2 + i}>
                Năm {currentYear - 2 + i}
              </option>
            ))}
          </StyledSelect>
        </MonthYearSelector>

        {monthlyStats && renderMonthlyStats()}

        <SalaryForm>
          <SubTitle>{selectedEmployee ? 'Cập nhật lương' : 'Tạo mới lương'}</SubTitle>
          <form onSubmit={handleSubmit}>
          {!selectedEmployee && (
  <FormGroup>
    <label>Nhân viên:</label>
    <Select
      name="userId"
      value={formData.userId}
      onChange={handleInputChange}
      required
    >
      <option value="">Chọn nhân viên</option>
      {employees.map((employee) => (
        <option key={employee._id} value={employee._id}>
          {employee.fullName} - {employee.position}
        </option>
      ))}
    </Select>
  </FormGroup>
)}

<FormGroup>
  <label>Lương cơ bản tháng {currentMonth}/{currentYear}:</label>
  <Input
    type="text"
    name="basicSalary"
    value={formData.basicSalary}
    onChange={handleInputChange}
    required
  />
  <small style={{ 
    color: '#64748b',
    marginTop: '4px',
    display: 'block',
    fontSize: '0.875rem' 
  }}>
    Lương theo giờ sẽ được tính dựa trên số ngày làm việc trong tháng
  </small>
</FormGroup>

<FormGroup>
  <label>Thưởng cơ bản:</label>
  <Input
    type="text"
    name="bonus"
    value={formData.bonus}
    onChange={handleInputChange}
    required
  />
</FormGroup>

<FormGroup>
  <label>Thông tin thêm:</label>
  <div style={{ 
    backgroundColor: '#f8fafc', 
    padding: '1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    lineHeight: '1.5'
  }}>
    <div>Số ngày làm việc trong tháng: {monthlyStats?.workingDays || 0} ngày</div>
    <div>Số giờ làm việc chuẩn: {formatWorkHours(monthlyStats?.standardWorkHours || 0)}</div>
    <div>Tổng lương đã chi: {formatCurrency(monthlyStats?.totalSalaryPaid || 0)}</div>
  </div>
</FormGroup>

<div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
  <Button
    type="submit"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {selectedEmployee ? 'Cập nhật' : 'Tạo mới'}
  </Button>
  
  {selectedEmployee && (
    <CancelButton
      type="button"
      onClick={() => {
        setSelectedEmployee(null);
        setFormData({ 
          userId: '', 
          basicSalary: '', 
          bonus: '', 
          month: currentMonth,
          year: currentYear 
        });
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Hủy
    </CancelButton>
  )}
</div>
          </form>
        </SalaryForm>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Tên nhân viên</Th>
                <Th>Chức vụ</Th>
                <Th>Lương cơ bản</Th>
                <Th>Số giờ làm việc</Th>
                <Th>Tỷ lệ làm việc</Th>
                <Th>Thưởng/Phạt Task</Th>
                <Th>Lương thực tế</Th>
                <Th>Feedback gần nhất</Th>
                <Th>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((salary) => (
                <Tr key={salary._id}>
                <Td>{salary.fullName || salary.userId?.fullName || 'N/A'}</Td>
                <Td>{salary.position || salary.userId?.position || 'N/A'}</Td>
                  <Td>{formatCurrency(salary.basicSalary)}</Td>
                  <Td>
                    <div>
                      <div>{formatWorkHours(salary.actualWorkHours)}</div>
                      <div>/{formatWorkHours(salary.standardWorkHours)}</div>
                    </div>
                  </Td>
                  <Td>{salary.workRatio}%</Td>
                  <Td>
                    <TaskRewardInfo salary={salary} />
                  </Td>
                  <Td>
                    <SalaryDetailInfo salary={salary} />
                  </Td>
                  <Td>
                    {feedbacks[salary.userId?._id]?.[0]?.message.substring(0, 30) + '...' || 'Chưa có feedback'}
                  </Td>
                  <Td>
                    <ActionButton onClick={() => handleUpdateClick(salary)}>
                      Cập nhật
                    </ActionButton>
                    <DeleteButton onClick={() => handleDelete(salary.userId?._id)}>
                      Xóa
                    </DeleteButton>
                    <FeedbackButton onClick={() => setSelectedUserForFeedback(salary.userId?._id)}>
                      Phản hồi
                    </FeedbackButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>

        <AnimatePresence>
          {selectedUserForFeedback && (
            <FeedbackSection>
              {selectedUserForFeedback && (
  <FeedbackSection
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <SubTitle>
      Phản hồi cho {salaries.find(s => s.userId?._id === selectedUserForFeedback)?.fullName || 'Nhân viên'}
      {' - '}Tháng {currentMonth}/{currentYear}
    </SubTitle>

    <FeedbackList>
      {feedbacks[selectedUserForFeedback]?.map((feedback) => (
        <motion.div
          key={feedback._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          {feedback.isFromAdmin ? (
            <AdminFeedback>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#2c3e50' }}>Admin</strong>
                <span style={{ color: '#7f8c8d', marginLeft: '10px', fontSize: '0.9em' }}>
                  {new Date(feedback.createdAt).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p style={{ margin: 0, color: '#34495e' }}>{feedback.message}</p>
            </AdminFeedback>
          ) : (
            <UserFeedback>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#2c3e50' }}>Nhân viên</strong>
                <span style={{ color: '#7f8c8d', marginLeft: '10px', fontSize: '0.9em' }}>
                  {new Date(feedback.createdAt).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p style={{ margin: 0, color: '#34495e' }}>{feedback.message}</p>
            </UserFeedback>
          )}
        </motion.div>
      ))}

      {(!feedbacks[selectedUserForFeedback] || feedbacks[selectedUserForFeedback].length === 0) && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#7f8c8d',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          Chưa có phản hồi nào
        </div>
      )}
    </FeedbackList>

    <FeedbackForm onSubmit={handleFeedbackSubmit}>
      <Textarea
        value={newFeedbackMessage}
        onChange={(e) => setNewFeedbackMessage(e.target.value)}
        placeholder="Nhập phản hồi của bạn..."
        required
      />
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Gửi phản hồi
        </Button>
        <CancelButton
          type="button"
          onClick={() => {
            setSelectedUserForFeedback(null);
            setNewFeedbackMessage('');
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Đóng
        </CancelButton>
      </div>
    </FeedbackForm>
  </FeedbackSection>
)}
            </FeedbackSection>
          )}
        </AnimatePresence>
      </ContentContainer>
    </PageContainer>
  );
};

export default SalaryAdmin;