import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const moment = require('moment-timezone');

const MySwal = withReactContent(Swal);


const formatTime = (time) => {
  if (!time) return 'Không có dữ liệu';
  // Nếu time đã là chuỗi HH:mm:ss, trả về luôn
  if (typeof time === 'string' && time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time;
  }
  // Nếu time là Date hoặc chuỗi ISO, chuyển đổi sang HH:mm:ss
  try {
    return new Date(time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Không có dữ liệu';
  }
};

const formatTimeResponse = (time) => {
  if (!time) return null;
  return moment(time).format('HH:mm:ss');
};

const AttendanceRow = ({ record }) => {
  // Tính tổng giờ làm việc từ workingHours
  const getTotalWorkHours = () => {
    if (record.workingHours?.total) {
      return record.workingHours.total;
    }
    
    // Nếu có checkIn và checkOut thì tính trực tiếp
    if (record.checkIn && record.checkOut) {
      const checkInTime = new Date(record.checkIn);
      const checkOutTime = new Date(record.checkOut);
      const diffMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} giờ ${minutes} phút`;
    }

    return 'Chưa có thông tin';
  };

  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>{record.date}</td>
      <td style={styles.tableCell}>{formatTime(record.checkIn)}</td>
      <td style={styles.tableCell}>
        {record.checkOut ? formatTime(record.checkOut) : 'Chưa check-out'}
      </td>
      <td style={styles.tableCell}>{getTotalWorkHours()}</td>
    </tr>
  );
};

const AttendanceTable = ({ attendanceRecords }) => {
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Ngày</th>
            <th style={styles.tableHeader}>Giờ Vào</th>
            <th style={styles.tableHeader}>Giờ Ra</th>
            <th style={styles.tableHeader}>Tổng Giờ Làm</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.map((record, index) => (
            <AttendanceRow key={record.date || index} record={record} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AttendanceUser = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [error, setError] = useState(null);

  const showAlert = (type, title, text, timer = null) => {
    MySwal.fire({
      icon: type,
      title,
      text,
      showConfirmButton: !timer,
      timer,
      footer: process.env.NODE_ENV === 'development' && type === 'error' ? text : null
    });
  };

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/auth/attendance/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const history = response.data.history || [];
      setAttendanceRecords(history);

      const today = new Date().toISOString().split('T')[0];
      const todayRecord = history.find(record => record.date === today);
      setCanCheckOut(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải dữ liệu chấm công';
      setError(errorMessage);
      showAlert('error', 'Oops...', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleAttendance = async (type) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('error', 'Lỗi xác thực', 'Vui lòng đăng nhập lại');
      return;
    }
  
    try {
      setLoading(true);
      const endpoint = type === 'in' ? 'check-in' : 'check-out';
      const response = await axios.post(
        `http://localhost:5000/api/auth/attendance/${endpoint}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data?.attendance) {
        const timeKey = type === 'in' ? 'checkIn' : 'checkOut';
        const time = response.data.attendance[timeKey];
        
        showAlert(
          'success',
          `Check-${type} thành công!`,
          `Thời gian: ${formatTime(time)}`,
          1500
        );
        await fetchAttendance();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.';
      showAlert('error', `Lỗi khi check-${type}`, errorMessage);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.container}>
        <h2 style={styles.title}>Chấm Công Của Bạn</h2>
        <div style={styles.attendanceActions}>
          <button
            onClick={() => handleAttendance('in')}
            style={styles.button.checkIn}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Check-in'}
          </button>
          {canCheckOut && (
            <button
              onClick={() => handleAttendance('out')}
              style={styles.button.checkOut}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Check-out'}
            </button>
          )}
        </div>
        {error && (
          <div style={styles.error}>{error}</div>
        )}
        {loading ? (
          <div style={styles.loading}>Đang tải dữ liệu...</div>
        ) : (
          <>
            <h3 style={styles.subtitle}>Lịch sử chấm công</h3>
            <AttendanceTable attendanceRecords={attendanceRecords} />
          </>
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
  attendanceActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px',
  },
  button: {
    checkIn: {
      padding: '12px 24px',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
      },
    },
    checkOut: {
      padding: '12px 24px',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
      },
    }
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
  },
  tableHeader: {
    backgroundColor: '#34495e',
    color: '#ffffff',
    padding: '15px',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: '600',
  },
  tableRow: {
    backgroundColor: '#f8fafc',
    transition: 'background-color 0.3s ease',
  },
  tableCell: {
    padding: '15px',
    fontSize: '16px',
    color: '#2c3e50',
    borderBottom: '1px solid #ecf0f1',
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
  }
};

export default AttendanceUser;