import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// Styled Components
const PageContainer = styled(motion.div)`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled(motion.div)`
  padding: 40px;
  max-width: 1200px;
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
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled(motion.table)`
  width: 100%;
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
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
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

const SalaryAdmin = () => {
  // States
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [selectedUserForFeedback, setSelectedUserForFeedback] = useState(null);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    basicSalary: '',
    bonus: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formatters
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

  const formatWorkHours = (hours) => {
    if (hours === undefined || hours === null) return 'N/A';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} giờ ${minutes} phút`;
  };

  // API Calls
  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/salary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries(response.data.salaries);
    } catch (error) {
      console.error('Lỗi chi tiết khi lấy dữ liệu lương:', error);
      setError(`Không thể lấy dữ liệu lương: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.users);
    } catch (error) {
      setError(`Không thể lấy danh sách nhân viên: ${error.message}`);
      console.error('Error fetching employees:', error);
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
      console.error('Error fetching feedbacks:', error);
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
        bonus: parseCurrency(formData.bonus)
      };

      await axios.post(`http://localhost:5000/api/auth/salary/${userId}`, submissionData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchSalaries();
      setSelectedEmployee(null);
      setFormData({ userId: '', basicSalary: '', bonus: '' });

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
      bonus: formatCurrency(salary.bonus)
    });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/feedback-salary',
        { message: newFeedbackMessage, userId: selectedUserForFeedback },
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

  // Loading and Error States
  if (loading) {
    return (
      <PageContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ContentContainer>
          <Title>Đang tải dữ liệu...</Title>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ContentContainer>
          <Title>Lỗi: {error}</Title>
        </ContentContainer>
      </PageContainer>
    );
  }

  // Render Component
  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <NavigationAdmin />
      <ContentContainer>
        <Title
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Quản lý lương nhân viên
        </Title>

        {/* Form Section */}
        <SalaryForm
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
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
                      {employee.fullName}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            )}
            <FormGroup>
              <label>Lương cơ bản:</label>
              <Input
                type="text"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <label>Thưởng:</label>
              <Input
                type="text"
                name="bonus"
                value={formData.bonus}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
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
                  setFormData({ userId: '', basicSalary: '', bonus: '' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Hủy
              </CancelButton>
            )}
          </form>
        </SalaryForm>

        {/* Table Section */}
        <SubTitle
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Danh sách lương nhân viên
        </SubTitle>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Tên nhân viên</Th>
                <Th>Chức vụ</Th>
                <Th>Lương cơ bản</Th>
                <Th>Lương theo giờ</Th>
                <Th>Số giờ làm việc</Th>
                <Th>Thưởng cơ bản</Th>
                <Th>Thưởng/Phạt task</Th>
                <Th>Lương thực tế</Th>
                <Th>Feedback gần nhất</Th>   {/* Thêm lại cột Feedback */}
                <Th>Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((salary) => (
                <Tr
                  key={salary._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Td>{salary.fullName || 'N/A'}</Td>
                  <Td>{salary.position || 'N/A'}</Td>
                  <Td>{formatCurrency(salary.basicSalary)}</Td>
                  <Td>{formatCurrency(salary.hourlyRate)}</Td>
                  <Td>{formatCurrency(salary.actualSalary)}</Td>
                  <Td>{formatCurrency(salary.bonus)}</Td>
                  <Td>
                    <div style={TaskRewardStyles.container}>
                      <div style={TaskRewardStyles.item}>
                        <div>
                          <span>Tasks hoàn thành:</span>
                          <div style={TaskRewardStyles.taskCount}>
                            {salary.completedTasks || 0} tasks
                          </div>
                        </div>
                      </div>
                      <div style={TaskRewardStyles.item}>
                        <span>Thưởng hoàn thành đúng hạn:</span>
                        <span style={TaskRewardStyles.bonusText}>+{formatCurrency(salary.taskBonus || 0)}
                        </span>
                      </div>
                      <div style={TaskRewardStyles.item}>
                        <span>Phạt trễ deadline:</span>
                        <span style={TaskRewardStyles.penaltyText}>-{formatCurrency(salary.taskPenalty || 0)}
                        </span>
                      </div>
                    </div>
                  </Td>
                  <Td style={TaskRewardStyles.total}>
                    {formatCurrency(salary.actualSalary)}
                  </Td>
                  <Td>      {/* Thêm lại cell hiển thị Feedback */}
                    {feedbacks[salary.userId?._id] && feedbacks[salary.userId._id][0]
                      ? feedbacks[salary.userId._id][0].message.substring(0, 30) + '...'
                      : 'Chưa có feedback'}
                  </Td>
                  <Td>
                    <ActionButton
                      onClick={() => handleUpdateClick(salary)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cập nhật
                    </ActionButton>
                    <DeleteButton
                      onClick={() => handleDelete(salary.userId?._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Xóa
                    </DeleteButton>
                    <FeedbackButton
                      onClick={() => setSelectedUserForFeedback(salary.userId?._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Phản hồi
                    </FeedbackButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>

        {/* Feedback Section */}
        <AnimatePresence>
          {selectedUserForFeedback && (
            <FeedbackSection
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SubTitle>
                Phản hồi cho {salaries.find(s => s.userId?._id === selectedUserForFeedback)?.fullName || 'Nhân viên'}
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
        </AnimatePresence>
      </ContentContainer>
    </PageContainer>
  );
};

const TaskDetailModal = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  
  &:hover {
    color: #334155;
  }
`;

export default SalaryAdmin;