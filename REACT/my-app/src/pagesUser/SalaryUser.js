import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';
import Swal from 'sweetalert2';
import moment from 'moment';

const SalaryUser = () => {
  const [salary, setSalary] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment().month() + 1);
  const [currentYear, setCurrentYear] = useState(moment().year());

  useEffect(() => {
    fetchSalaryAndFeedbacks();
  }, [currentMonth, currentYear]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatWorkHours = (hours) => {
    if (hours === undefined || hours === null) return 'N/A';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours} giờ ${minutes} phút`;
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  const renderWorkingTimeInfo = () => {
    if (!salary) return null;
  
    return (
      <div style={styles.workingTimeSection}>
        <h3 style={styles.subtitle}>Thông tin giờ làm việc</h3>
        <div style={styles.workingTimeInfo}>
          <div style={styles.infoItem}>
            <span>Số giờ làm việc thực tế:</span>
            <span>{formatWorkHours(salary.actualWorkHours)}</span>
          </div>
          <div style={styles.infoItem}>
            <span>Số giờ làm việc chuẩn:</span>
            <span>{formatWorkHours(salary.standardWorkHours)}</span>
          </div>
          <div style={styles.infoItem}>
            <span>Tỷ lệ làm việc:</span>
            <span>{salary.workRatio}%</span>
          </div>
          <div style={styles.infoItem}>
            <span>Số ngày làm việc:</span>
            <span>{salary.workingDays} ngày</span>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTaskRewards = () => {
    if (!salary) return null;
  
    return (
      <div style={styles.taskRewardsSection}>
        <h3 style={styles.subtitle}>Thông tin thưởng/phạt từ công việc</h3>
        <div style={styles.taskRewardsInfo}>
          <div style={styles.rewardItem}>
            <div>
              <span>Tasks hoàn thành:</span>
              <div style={styles.taskCount}>
                {salary.completedTasks || 0} tasks
              </div>
            </div>
          </div>
          <div style={styles.rewardItem}>
            <span>Thưởng hoàn thành đúng hạn:</span>
            <span style={styles.bonusText}>+{formatCurrency(salary.taskBonus || 0)}</span>
          </div>
          <div style={styles.rewardItem}>
            <span>Phạt trễ deadline:</span>
            <span style={styles.penaltyText}>-{formatCurrency(salary.taskPenalty || 0)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSalaryBreakdown = () => {
    if (!salary) return null;
  
    // Tính toán lương theo giờ
    const hourlyPay = salary.basicSalary / salary.standardWorkHours; // Lương giờ = Lương cơ bản / Số giờ chuẩn
    const baseHourlySalary = hourlyPay * (salary.actualWorkHours || 0); // Lương thực tế = Lương giờ * Số giờ làm việc
    const totalBonus = (salary.bonus || 0) + (salary.taskBonus || 0);
    const totalPenalty = salary.taskPenalty || 0;
  
    return (
      <div style={styles.breakdownSection}>
        <h3 style={styles.subtitle}>Chi tiết lương tháng {currentMonth}/{currentYear}</h3>
        <div style={styles.breakdownList}>
          <div style={styles.breakdownItem}>
            <span>Lương theo giờ:</span>
            <span>{formatCurrency(hourlyPay)}/giờ</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Lương theo giờ làm việc:</span>
            <span>{formatCurrency(baseHourlySalary)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Thưởng cơ bản:</span>
            <span style={styles.bonusText}>+{formatCurrency(salary.bonus || 0)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Thưởng từ công việc:</span>
            <span style={styles.bonusText}>+{formatCurrency(salary.taskBonus || 0)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Phạt từ công việc:</span>
            <span style={styles.penaltyText}>-{formatCurrency(totalPenalty)}</span>
          </div>
          <div style={styles.breakdownTotal}>
            <span>Tổng lương thực tế:</span>
            <span>{formatCurrency(salary.totalSalary)}</span>
          </div>
        </div>
      </div>
    );
  };


  const fetchSalaryAndFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      setSalary(null);
      
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
  
      const [salaryResponse, feedbackResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: currentMonth, year: currentYear }
        }),
        axios.get(`http://localhost:5000/api/auth/feedback-salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
  
      // Kiểm tra response status
      if (salaryResponse.status === 404) {
        setError(`Không có dữ liệu lương cho tháng ${currentMonth}/${currentYear}`);
        setSalary(null);
      } else if (salaryResponse.data && salaryResponse.data.salary) {
        setSalary(salaryResponse.data.salary);
        setError(null);
      } else {
        setError('Không thể lấy thông tin lương');
        setSalary(null);
      }
      
      setFeedbacks(feedbackResponse.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching salary and feedbacks:', error);
      if (error.response && error.response.status === 404) {
        setError(`Không có dữ liệu lương cho tháng ${currentMonth}/${currentYear}`);
      } else {
        setError('Không thể lấy thông tin. Vui lòng thử lại sau.');
      }
      setSalary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/feedback-salary', 
        { 
          message: newFeedbackMessage,
          month: currentMonth,
          year: currentYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewFeedbackMessage('');
      fetchSalaryAndFeedbacks();
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

  const renderContent = () => {
    if (loading) {
      return <div style={styles.loading}>Đang tải thông tin...</div>;
    }
  
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Thông Tin Lương Của Bạn</h2>
  
        <div style={styles.monthSelector}>
          <select 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            style={styles.select}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            style={styles.select}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={currentYear - 2 + i} value={currentYear - 2 + i}>
                Năm {currentYear - 2 + i}
              </option>
            ))}
          </select>
        </div>
  
        {error ? (
          <div style={styles.error}>{error}</div>
        ) : salary ? (
          <>
            <div style={styles.salaryInfo}>
              <div style={styles.mainInfo}>
                <div style={styles.infoItem}>
                  <strong>Lương cơ bản:</strong>
                  <span>{formatCurrency(salary.basicSalary)}</span>
                </div>
                <div style={styles.infoItem}>
                  <strong>Lương theo giờ:</strong>
                  {formatCurrency(salary.basicSalary / salary.standardWorkHours)}/giờ
                </div>
              </div>
  
              {renderWorkingTimeInfo()}
              {renderTaskRewards()}
              {renderSalaryBreakdown()}
            </div>
          </>
        ) : null}
  
        <h3 style={styles.subtitle}>Feedback Lương</h3>
        <div style={styles.feedbackList}>
          {feedbacks.map((feedback) => (
            <div 
              key={feedback._id} 
              style={feedback.isFromAdmin ? styles.adminFeedback : styles.userFeedback}
            >
              <div style={styles.feedbackHeader}>
                <strong>{feedback.isFromAdmin ? 'Admin' : 'Bạn'}</strong>
                <span>{formatDate(feedback.createdAt)}</span>
              </div>
              <p>{feedback.message}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleFeedbackSubmit} style={styles.feedbackForm}>
          <textarea
            value={newFeedbackMessage}
            onChange={(e) => setNewFeedbackMessage(e.target.value)}
            placeholder="Nhập feedback của bạn về lương"
            required
            style={styles.textarea}
          />
          <button type="submit" style={styles.submitBtn}>
            Gửi Feedback
          </button>
        </form>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <NavigationUser />
      {renderContent()}
    </div>
  );
};

const styles = {


  monthSelector: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center'
  },
  select: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '120px'
  },
  workingTimeSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  workingTimeInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  page: {
    backgroundColor: '#f4f7f9',
    minHeight: '100vh',
  },
  container: {
    padding: '40px',
    maxWidth: '1000px',
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
  mainInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  taskRewardsSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  taskRewardsInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rewardItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  taskCount: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '0.25rem',
  },
  bonusText: {
    color: '#27ae60',
    fontWeight: '600',
  },
  penaltyText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  breakdownSection: {
    marginTop: '2rem',
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  breakdownTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '1.1em',
    marginTop: '0.5rem',
  },
  feedbackList: {
    marginBottom: '30px',
  },
  adminFeedback: {
    backgroundColor: '#e8f5e9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  userFeedback: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#555',
  },
  feedbackForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    padding: '15px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '15px',
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    '&:focus': {
      borderColor: '#3498db',
    },
  },
  submitBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    alignSelf: 'flex-start',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      backgroundColor: '#2980b9',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#3498db',
    margin: '20px 0',
    padding: '40px',
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
  salaryInfo: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
};

export default SalaryUser;