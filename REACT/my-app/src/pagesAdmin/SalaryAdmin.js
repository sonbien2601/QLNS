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
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  font-size: 18px;
  color: #ffffff;
  background-color: #3498db;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2980b9;
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
`;

const Table = styled(motion.table)`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`;

const Th = styled.th`
  background-color: #34495e;
  color: #ffffff;
  padding: 15px;
  text-align: left;
  font-size: 16px;
  font-weight: 600;
`;

const Tr = styled(motion.tr)`
  background-color: #f8fafc;
  transition: background-color 0.3s ease;
`;

const Td = styled.td`
  padding: 15px;
  font-size: 16px;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
`;

const ActionButton = styled(motion.button)`
  padding: 8px 12px;
  font-size: 14px;
  color: #ffffff;
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-right: 5px;

  &:hover {
    background-color: #2980b9;
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
  padding: 20px;
  border-radius: 8px;
`;

const FeedbackList = styled.div`
  margin-bottom: 20px;
`;

const FeedbackItem = styled(motion.div)`
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const AdminFeedback = styled(FeedbackItem)`
  background-color: #e8f5e9;
`;

const UserFeedback = styled(FeedbackItem)`
  background-color: #e3f2fd;
`;

const FeedbackForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const Textarea = styled.textarea`
  padding: 10px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 15px;
  min-height: 100px;
`;

const SalaryAdmin = () => {
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

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
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

  // Giải thích:
  // - formatCurrency: Chuyển đổi số thành định dạng tiền tệ Việt Nam
  //   Ví dụ: 5000000 -> "5.000.000 ₫"
  // - formatWorkHours: Chuyển đổi số giờ thành định dạng "X giờ Y phút"
  //   Ví dụ: 8.5 -> "8 giờ 30 phút"

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/salary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries(response.data.salaries);
    } catch (error) {
      console.error('Lỗi chi tiết khi lấy dữ liệu lương:', error.response?.data || error.message);
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

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
    fetchAllFeedbacks();
  }, [fetchSalaries, fetchEmployees, fetchAllFeedbacks]);

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

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ContentContainer>
        <Title
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Quản lý lương nhân viên
        </Title>
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

        <SubTitle
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Danh sách lương nhân viên
        </SubTitle>
        {salaries.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Không có dữ liệu lương
          </motion.p>
        ) : (
          <TableContainer>
          <Table
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <thead>
              <tr>
                <Th>Tên nhân viên</Th>
                <Th>Chức vụ</Th>
                <Th>Lương cơ bản</Th>
                <Th>Lương theo giờ</Th>
                <Th>Số giờ làm việc</Th>
                <Th>Thưởng</Th>
                <Th>Lương thực tế</Th>
                <Th>Feedback gần nhất</Th>
                <Th>Hành động</Th>
              </tr>
            </thead>
            <AnimatePresence>
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
                    <Td>{formatWorkHours(salary.actualWorkHours)}</Td>
                    <Td>{formatCurrency(salary.bonus)}</Td>
                    <Td>{formatCurrency(salary.actualSalary)}</Td>
                    <Td>
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
                        Xem/Trả lời Feedback
                      </FeedbackButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </AnimatePresence>
          </Table>
        </TableContainer>
        )}
        <AnimatePresence>
          {selectedUserForFeedback && (
            <FeedbackSection
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SubTitle>
                Feedback của {salaries.find(s => s.userId._id === selectedUserForFeedback)?.userId.fullName}
              </SubTitle>
              <FeedbackList>
                {feedbacks[selectedUserForFeedback]?.map((feedback) => (
                  <FeedbackItem
                    key={feedback._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p>{feedback.message}</p>
                    <small>{new Date(feedback.createdAt).toLocaleString()}</small>
                  </FeedbackItem>
                ))}
              </FeedbackList>
              <FeedbackForm onSubmit={handleFeedbackSubmit}>
                <Textarea
                  value={newFeedbackMessage}
                  onChange={(e) => setNewFeedbackMessage(e.target.value)}
                  placeholder="Nhập phản hồi của bạn"
                  required
                />
                <Button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Gửi Phản Hồi
                </Button>
              </FeedbackForm>
            </FeedbackSection>
          )}
        </AnimatePresence>
      </ContentContainer>
    </PageContainer>
  );
};

export default SalaryAdmin;



// 1. Tính tổng số giờ làm việc thực tế:

//    GiờLàmThựcTế = Tổng(Giờ + Phút/60)

//    Trong đó:
//    - GiờLàmThựcTế: Tổng số giờ làm việc thực tế của nhân viên
//    - Giờ: Số giờ trong mỗi lần chấm công
//    - Phút: Số phút trong mỗi lần chấm công (nếu có)

// 2. Tính lương theo giờ:

//    LươngTheoGiờ = LươngCơBản / GiờChuẩn

//    Trong đó:
//    - LươngTheoGiờ: Mức lương cho mỗi giờ làm việc
//    - LươngCơBản: Lương cơ bản hàng tháng
//    - GiờChuẩn: Số giờ làm việc tiêu chuẩn trong một tháng (thường là 176 giờ)

// 3. Tính lương thực tế:

//    LươngThựcTế = (LươngTheoGiờ × GiờLàmThựcTế) + Thưởng

//    Trong đó:
//    - LươngThựcTế: Tổng số tiền lương nhân viên nhận được
//    - LươngTheoGiờ: Đã tính ở bước 2
//    - GiờLàmThựcTế: Đã tính ở bước 1
//    - Thưởng: Các khoản thưởng (nếu có)

// Công thức tổng hợp:

// LươngThựcTế = (LươngCơBản / GiờChuẩn) × GiờLàmThựcTế + Thưởng

// Ví dụ cụ thể:
// Giả sử:
// - LươngCơBản = 5,000,000 VNĐ
// - GiờChuẩn = 176 giờ
// - GiờLàmThựcTế = 160 giờ (ví dụ nhân viên làm thiếu 16 giờ trong tháng)
// - Thưởng = 500,000 VNĐ

// Áp dụng công thức:

// 1. Tính LươngTheoGiờ:
//    LươngTheoGiờ = 5,000,000 / 176 ≈ 28,409 VNĐ/giờ

// 2. Tính LươngThựcTế:
//    LươngThựcTế = (28,409 × 160) + 500,000
//                 ≈ 4,545,440 + 500,000
//                 ≈ 5,045,440 VNĐ

// Giải thích:
// - Nhân viên được trả 28,409 VNĐ cho mỗi giờ làm việc.
// - Họ đã làm việc 160 giờ trong tháng.
// - Lương dựa trên giờ làm việc là 4,545,440 VNĐ.
// - Cộng thêm khoản thưởng 500,000 VNĐ.
// - Tổng lương thực tế là 5,045,440 VNĐ.

// Lưu ý:
// 1. Công thức này giả định lương được tính dựa trên số giờ làm việc thực tế.
// 2. Trong thực tế, có thể có thêm nhiều yếu tố khác như phụ cấp, 
//    khấu trừ, chính sách làm thêm giờ, v.v.
// 3. Các con số được làm tròn có thể dẫn đến sai số nhỏ trong tính toán.