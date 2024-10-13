import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';
import Swal from 'sweetalert2';

const SalaryUser = () => {
  const [salary, setSalary] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalaryAndFeedbacks();
  }, []);

  const fetchSalaryAndFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const [salaryResponse, feedbackResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:5000/api/auth/feedback-salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setSalary(salaryResponse.data.salary);
      setFeedbacks(feedbackResponse.data.feedbacks);
    } catch (error) {
      console.error('Error fetching salary and feedbacks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể lấy thông tin. Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/feedback-salary', 
        { message: newFeedbackMessage },
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

  const formatCurrency = (value) => {
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
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải thông tin...</div>;
  }

  if (error) {
    return <div style={styles.error}>Lỗi: {error}</div>;
  }

  if (!salary) {
    return <div style={styles.error}>Không có thông tin lương.</div>;
  }

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.container}>
        <h2 style={styles.title}>Thông Tin Lương Của Bạn</h2>
        <div style={styles.salaryInfo}>
          <p><strong>Lương cơ bản:</strong> {formatCurrency(salary.basicSalary)}</p>
          <p><strong>Thưởng:</strong> {formatCurrency(salary.bonus)}</p>
          <p><strong>Số giờ làm việc:</strong> {formatWorkHours(salary.actualWorkHours)}</p>
          <p><strong>Lương theo giờ:</strong> {formatCurrency(salary.hourlyRate)}</p>
          <p><strong>Lương thực tế:</strong> {formatCurrency(salary.actualSalary)}</p>
        </div>

        <h3 style={styles.subtitle}>Feedback Lương</h3>
        <div style={styles.feedbackList}>
          {feedbacks.map((feedback) => (
            <div key={feedback._id} style={feedback.isFromAdmin ? styles.adminFeedback : styles.userFeedback}>
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
          <button type="submit" style={styles.submitBtn}>Gửi Feedback</button>
        </form>
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
  salaryInfo: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  feedbackList: {
    marginBottom: '30px',
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
    padding: '10px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '15px',
    minHeight: '100px',
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
    alignSelf: 'flex-start',
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

export default SalaryUser;