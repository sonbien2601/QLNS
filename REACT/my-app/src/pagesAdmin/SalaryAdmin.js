import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';
import Swal from 'sweetalert2';

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

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/salary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries(response.data.salaries);
    } catch (error) {
      setError('Không thể lấy dữ liệu lương');
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.users);
    } catch (error) {
      setError('Không thể lấy danh sách nhân viên');
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAllFeedbacks = async () => {
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
      console.error('Error fetching feedbacks:', error);
      setError('Không thể lấy feedback. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
    fetchAllFeedbacks();
  }, []);

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
      console.error('Error submitting salary:', error);
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
    return <div>Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <div style={styles.page}>
      <NavigationAdmin />
      <div style={styles.container}>
        <h2 style={styles.title}>Quản lý lương nhân viên</h2>
        <div style={styles.salaryForm}>
          <h3 style={styles.subtitle}>{selectedEmployee ? 'Cập nhật lương' : 'Tạo mới lương'}</h3>
          <form onSubmit={handleSubmit}>
            {!selectedEmployee && (
              <div style={styles.formGroup}>
                <label>Nhân viên:</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  style={styles.select}
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={styles.formGroup}>
              <label>Lương cơ bản:</label>
              <input
                type="text"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Thưởng:</label>
              <input
                type="text"
                name="bonus"
                value={formData.bonus}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.submitBtn}>
              {selectedEmployee ? 'Cập nhật' : 'Tạo mới'}
            </button>
            {selectedEmployee && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployee(null);
                  setFormData({ userId: '', basicSalary: '', bonus: '' });
                }}
                style={styles.cancelBtn}
              >
                Hủy
              </button>
            )}
          </form>
        </div>
        
        <h3 style={styles.subtitle}>Danh sách lương nhân viên</h3>
        {salaries.length === 0 ? (
          <p>Không có dữ liệu lương</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tên nhân viên</th>
                  <th style={styles.th}>Chức vụ</th>
                  <th style={styles.th}>Lương cơ bản</th>
                  <th style={styles.th}>Lương theo giờ</th>
                  <th style={styles.th}>Số giờ làm việc</th>
                  <th style={styles.th}>Thưởng</th>
                  <th style={styles.th}>Lương thực tế</th>
                  <th style={styles.th}>Feedback gần nhất</th>
                  <th style={styles.th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary) => (
                  <tr key={salary._id} style={styles.tr}>
                    <td style={styles.td}>{salary.userId.fullName}</td>
                    <td style={styles.td}>{salary.userId.position}</td>
                    <td style={styles.td}>{formatCurrency(salary.basicSalary)}</td>
                    <td style={styles.td}>{formatCurrency(salary.hourlyRate)}</td>
                    <td style={styles.td}>{formatWorkHours(salary.actualWorkHours)}</td>
                    <td style={styles.td}>{formatCurrency(salary.bonus)}</td>
                    <td style={styles.td}>{formatCurrency(salary.actualSalary)}</td>
                    <td style={styles.td}>
                      {feedbacks[salary.userId._id] && feedbacks[salary.userId._id][0]
                        ? feedbacks[salary.userId._id][0].message.substring(0, 30) + '...'
                        : 'Chưa có feedback'}
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => handleUpdateClick(salary)} style={styles.actionBtn}>Cập nhật</button>
                      <button onClick={() => handleDelete(salary.userId._id)} style={styles.deleteBtn}>Xóa</button>
                      <button onClick={() => setSelectedUserForFeedback(salary.userId._id)} style={styles.feedbackBtn}>Xem/Trả lời Feedback</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUserForFeedback && (
          <div style={styles.feedbackSection}>
            <h3 style={styles.subtitle}>Feedback của {salaries.find(s => s.userId._id === selectedUserForFeedback)?.userId.fullName}</h3>
            <div style={styles.feedbackList}>
              {feedbacks[selectedUserForFeedback]?.map((feedback) => (
                <div key={feedback._id} style={feedback.isFromAdmin ? styles.adminFeedback : styles.userFeedback}>
                  <p>{feedback.message}</p>
                  <small>{new Date(feedback.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
            <form onSubmit={handleFeedbackSubmit} style={styles.feedbackForm}>
              <textarea
                value={newFeedbackMessage}
                onChange={(e) => setNewFeedbackMessage(e.target.value)}
                placeholder="Nhập phản hồi của bạn"
                required
                style={styles.textarea}
              />
              <button type="submit" style={styles.submitBtn}>Gửi Phản Hồi</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#f4f7f9',
    minHeight: '100vh',
  },
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
    color: '#2c3e50',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  subtitle: {
    fontSize: '24px',
    marginTop: '40px',
    marginBottom: '20px',
    color: '#34495e',
    fontWeight: '600',
  },
  salaryForm: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  submitBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  cancelBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginLeft: '10px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
  },
  th: {
    backgroundColor: '#34495e',
    color: '#ffffff',
    padding: '15px',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: '600',
  },
  tr: {
    backgroundColor: '#f8fafc',
    transition: 'background-color 0.3s ease',
  },
  td: {
    padding: '15px',
    fontSize: '16px',
    color: '#2c3e50',
    borderBottom: '1px solid #ecf0f1',
  },
  actionBtn: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginRight: '5px',
  },
  deleteBtn: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginRight: '5px',
  },
  feedbackBtn: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#2ecc71',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  feedbackSection: {
    marginTop: '40px',
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
  },
  feedbackList: {
    marginBottom: '20px',
  },
  adminFeedback: {
    backgroundColor: '#e8f5e9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  userFeedback: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  feedbackForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '15px',
    minHeight: '100px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#3498db',
    margin: '20px 0',
  },
  error: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#e74c3c',
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#fde8e8',
    borderRadius: '8px',
  },
};


export default SalaryAdmin;