import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';
import Swal from 'sweetalert2';
import moment from 'moment';

// Constants có thể giữ bên ngoài vì không phụ thuộc vào state
const TIME_CONSTANTS = {
  WORKING_HOURS: {
    MORNING: {
      START: 8 * 60,      // 8:00
      END: 12 * 60,       // 12:00
      BUFFER: 15          // 15 phút buffer
    },
    AFTERNOON: {
      START: 13 * 60 + 30, // 13:30
      END: 17 * 60 + 30,   // 17:30
      BUFFER: 15           // 15 phút buffer
    }
  }
};

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

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '0 giờ 0 phút';
    
    // Parse times
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    // Convert to total minutes
    const checkInMinutes = inHours * 60 + inMinutes;
    const checkOutMinutes = outHours * 60 + outMinutes;
    
    // Calculate duration in minutes and round down to nearest 15 minutes
    let durationMinutes = checkOutMinutes - checkInMinutes;
    durationMinutes = Math.floor(Math.max(0, durationMinutes) / 15) * 15;
    
    // Convert to hours and minutes
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours} giờ ${minutes} phút`;
  };

  const calculateLateMinutes = (checkInTime, period) => {
    if (!checkInTime) return 0;
    
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
  
    if (period === 'morning') {
      const expectedTime = TIME_CONSTANTS.WORKING_HOURS.MORNING.START; // 8:00
      return Math.max(0, timeInMinutes - expectedTime); // Bỏ buffer 15 phút
    } else {
      const expectedTime = TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.START; // 13:30
      return Math.max(0, timeInMinutes - expectedTime); // Bỏ buffer 15 phút 
    }
  };

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

  const renderLateInfo = () => {
    if (!salary) return null;
  
    // Lấy thông tin đi muộn từ monthlyLateData
    const monthlyLateData = salary.monthlyLateData || {
      lateCount: 0,
      latePenalty: 0,
      lateDetails: []
    };
  
    return (
      <div style={styles.lateSection}>
        <h3 style={styles.subtitle}>Thông tin đi muộn</h3>
        <div style={styles.lateInfo}>
          <div style={styles.rewardItem}>
            <span>Số lần đi muộn:</span>
            <span style={styles.penaltyText}>{monthlyLateData.lateCount || 0} lần</span>
          </div>
          <div style={styles.rewardItem}>
            <span>Tổng tiền phạt đi muộn:</span>
            <span style={styles.penaltyText}>-{formatCurrency(monthlyLateData.latePenalty || 0)}</span>
          </div>
          
          {monthlyLateData.lateDetails && monthlyLateData.lateDetails.length > 0 && (
            <div style={styles.lateDetailsList}>
              <h4 style={styles.lateDetailsTitle}>Chi tiết các lần đi muộn:</h4>
              {monthlyLateData.lateDetails.map((detail, index) => {
                const checkInTime = moment(detail.date).format('HH:mm');
                const lateMinutes = detail.minutes || calculateLateMinutes(checkInTime, detail.session);
                
                return (
                  <div key={index} style={styles.lateDetailItem}>
                    <span>{moment(detail.date).format('DD/MM/YYYY')}</span>
                    <span>{detail.session === 'morning' ? 'Sáng' : 'Chiều'}</span>
                    <span>Muộn {lateMinutes} phút</span>
                    <span style={styles.penaltyText}>-{formatCurrency(detail.penalty)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
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
  
    const hourlyPay = salary.basicSalary / salary.standardWorkHours;
    const baseHourlySalary = hourlyPay * (salary.actualWorkHours || 0);
    const totalBonus = (salary.bonus || 0) + (salary.taskBonus || 0);
    const totalPenalty = (salary.taskPenalty || 0) + 
      (salary.monthlyLateData?.latePenalty || 0);
  
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
            <span style={styles.penaltyText}>-{formatCurrency(salary.taskPenalty || 0)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Phạt đi muộn:</span>
            <span style={styles.penaltyText}>-{formatCurrency(salary.monthlyLateData?.latePenalty || 0)}</span>
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
  
      console.log('Fetching data for:', { month: currentMonth, year: currentYear });
  
      const [salaryResponse, feedbackResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: currentMonth, year: currentYear }
        }),
        axios.get(`http://localhost:5000/api/auth/feedback-salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: currentMonth, year: currentYear }
        })
      ]);
  
      if (salaryResponse.data && salaryResponse.data.salary) {
        setSalary(salaryResponse.data.salary);
        setError(null);
      } else {
        setError('Không có dữ liệu lương cho tháng này');
        setSalary(null);
      }
      
      // Log để debug
      console.log('Received feedbacks:', feedbackResponse.data.feedbacks);
      console.log('Current month/year:', currentMonth, currentYear);
      console.log('Feedback data:', feedbackResponse.data.feedbacks.map(f => ({
        message: f.message,
        month: f.month,
        year: f.year,
        createdAt: f.createdAt
      })));
  
      setFeedbacks(feedbackResponse.data.feedbacks || []);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể lấy thông tin. Vui lòng thử lại sau.');
      setSalary(null);
    } finally {
      setLoading(false);
    }
  };
  

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Sending feedback for:', { month: currentMonth, year: currentYear });
      
      await axios.post('http://localhost:5000/api/auth/feedback-salary', 
        { 
          message: newFeedbackMessage,
          month: currentMonth, // Đảm bảo gửi đúng tháng hiện tại
          year: currentYear   // Đảm bảo gửi đúng năm hiện tại
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewFeedbackMessage('');
      fetchSalaryAndFeedbacks(); // Refresh data sau khi gửi feedback
      
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
              {renderLateInfo()}
              {renderTaskRewards()}
              {renderSalaryBreakdown()}
            </div>
          </>
        ) : null}

        <h3 style={styles.subtitle}>Feedback Lương</h3>
        <div style={styles.feedbackList}>
  {feedbacks && feedbacks.length > 0 ? (
    feedbacks.map((feedback) => (
      <div 
        key={feedback._id} 
        style={feedback.isFromAdmin ? styles.adminFeedback : styles.userFeedback}
      >
        <div style={styles.feedbackHeader}>
          <strong>{feedback.isFromAdmin ? 'Admin' : 'Bạn'}</strong>
          <span>
            {feedback.month && feedback.year 
              ? `Tháng ${feedback.month}/${feedback.year} - `
              : ''
            }
            {formatDate(feedback.createdAt)}
          </span>
        </div>
        <p>{feedback.message}</p>
      </div>
    ))
  ) : (
    <div style={styles.noFeedback}>
      Chưa có feedback nào cho tháng {currentMonth}/{currentYear}
    </div>
  )}
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
  lateSection: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  lateInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  lateDetailsList: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  lateDetailsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#2c3e50',
  },
  lateDetailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    borderBottom: '1px solid #edf2f7',
    fontSize: '0.875rem',
  },
  noFeedback: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    color: '#6c757d',
    fontStyle: 'italic'
  }
};

export default SalaryUser;