import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa'
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    padding: '2rem',
    marginTop: '2rem'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #eee'
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#34495e',
    margin: '2rem 0 1.5rem'
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  },
  buttonBase: {
    padding: '0.8rem 2rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  checkInButton: {
    backgroundColor: '#2ecc71',
    color: 'white',
    ':hover': {
      backgroundColor: '#27ae60',
      transform: 'translateY(-1px)'
    }
  },
  checkOutButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    ':hover': {
      backgroundColor: '#c0392b',
      transform: 'translateY(-1px)'
    }
  },
  disabledButton: {
    opacity: '0.7',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fff3f3',
    color: '#e74c3c',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #ffd1d1'
  },
  loading: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: '2rem',
    fontSize: '1.1rem'
  },
  tableContainer: {
    overflowX: 'auto',
    margin: '1rem -1rem',
    padding: '0 1rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    margin: '1rem 0'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    color: '#2c3e50'
  },
  td: {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid #eee',
    color: '#34495e'
  },
  tr: {
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  statusBadge: {
    base: {
      display: 'inline-block',
      padding: '0.4rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: '500'
    },
    late: {
      backgroundColor: '#fff3f3',
      color: '#e74c3c'
    },
    present: {
      backgroundColor: '#edfff5',
      color: '#27ae60'
    },
    pending: {
      backgroundColor: '#f8f9fa',
      color: '#7f8c8d'
    }
  }
};

const formatTime = (time) => {
  if (!time) return 'Không có dữ liệu';
  return time;
};

const AttendanceRow = ({ record }) => {
  const getStatusStyle = (status) => {
    switch(status) {
      case 'late':
        return { ...styles.statusBadge.base, ...styles.statusBadge.late };
      case 'present':
        return { ...styles.statusBadge.base, ...styles.statusBadge.present };
      default:
        return { ...styles.statusBadge.base, ...styles.statusBadge.pending };
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'late': return 'Đi muộn';
      case 'present': return 'Đúng giờ';
      default: return 'Chưa xác định';
    }
  };

  return (
    <tr style={styles.tr}>
      <td style={styles.td}>{record.date}</td>
      <td style={styles.td}>
        {record.morningSession.checkIn ? formatTime(record.morningSession.checkIn) : 'Chưa check-in'}
      </td>
      <td style={styles.td}>
        {record.morningSession.checkOut ? formatTime(record.morningSession.checkOut) : 'Chưa check-out'}
      </td>
      <td style={styles.td}>
        {record.afternoonSession.checkIn ? formatTime(record.afternoonSession.checkIn) : 'Chưa check-in'}
      </td>
      <td style={styles.td}>
        {record.afternoonSession.checkOut ? formatTime(record.afternoonSession.checkOut) : 'Chưa check-out'}
      </td>
      <td style={styles.td}>{record.totalHours || 'Chưa có thông tin'}</td>
      <td style={styles.td}>
        <span style={getStatusStyle(record.status)}>
          {getStatusText(record.status)}
        </span>
      </td>
    </tr>
  );
};

const AttendanceTable = ({ attendanceRecords }) => {
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Ngày</th>
            <th style={styles.th}>Check-in Sáng</th>
            <th style={styles.th}>Check-out Sáng</th>
            <th style={styles.th}>Check-in Chiều</th>
            <th style={styles.th}>Check-out Chiều</th>
            <th style={styles.th}>Tổng Giờ</th>
            <th style={styles.th}>Trạng Thái</th>
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
  const [error, setError] = useState(null);

  const showAlert = (type, title, text) => {
    MySwal.fire({
      icon: type,
      title,
      text,
      timer: type === 'success' ? 1500 : undefined,
      showConfirmButton: type !== 'success'
    });
  };

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/auth/attendance/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceRecords(response.data.history || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải dữ liệu chấm công';
      setError(errorMessage);
      showAlert('error', 'Lỗi', errorMessage);
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
      const endpoint = `http://localhost:5000/api/auth/attendance/check-${type}`;
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.attendance) {
        showAlert(
          'success',
          `Check-${type} thành công!`,
          `Thời gian: ${response.data.attendance.checkIn || response.data.attendance.checkOut}`
        );
        await fetchAttendance();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Lỗi khi check-${type}`;
      showAlert('error', 'Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (type) => ({
    ...styles.buttonBase,
    ...(type === 'in' ? styles.checkInButton : styles.checkOutButton),
    ...(loading ? styles.disabledButton : {})
  });

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Chấm Công Của Bạn</h2>
          
          <div style={styles.actionButtons}>
            <button
              onClick={() => handleAttendance('in')}
              style={getButtonStyle('in')}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Check-in'}
            </button>
            <button
              onClick={() => handleAttendance('out')}
              style={getButtonStyle('out')}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Check-out'}
            </button>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={styles.loading}>Đang tải dữ liệu...</div>
          ) : (
            <>
              <h3 style={styles.sectionTitle}>Lịch sử chấm công</h3>
              <AttendanceTable attendanceRecords={attendanceRecords} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceUser;