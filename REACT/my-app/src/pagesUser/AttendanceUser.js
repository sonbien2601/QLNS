import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import moment from 'moment';
import 'moment/locale/vi';

const MySwal = withReactContent(Swal);

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    padding: '2rem'
  },
  card: {
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '2rem'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  button: {
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    minWidth: '100px'
  },
  checkInButton: {
    backgroundColor: '#2ecc71'
  },
  checkOutButton: {
    backgroundColor: '#e74c3c'
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 0.5rem'
  },
  thead: {
    backgroundColor: '#f8f9fa',
    height: '40px'
  },
  th: {
    padding: '0.5rem 1rem',
    textAlign: 'left',
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: '14px'
  },
  tr: {
    backgroundColor: 'white',
    border: '1px solid #edf2f7',
    height: '100px'
  },
  td: {
    padding: '1rem',
    color: '#2c3e50',
    fontSize: '14px',
    verticalAlign: 'top',
    borderBottom: '1px solid #edf2f7'
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  timeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.5rem'
  },
  badge: {
    display: 'inline-block',
    padding: '0.375rem 1rem',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'center',
    width: 'fit-content'
  },
  onTimeBadge: {
    backgroundColor: '#edfff5',
    color: '#27ae60'
  },
  lateBadge: {
    backgroundColor: '#fff3f3',
    color: '#e74c3c'
  },
  totalHours: {
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center'
  }
};

// Thêm constants
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


// Thêm hàm format time
const formatTime = (timeString) => {
  if (!timeString) return 'Chưa có dữ liệu';
  
  // Nếu timeString chỉ là thời gian (HH:mm:ss)
  if (timeString.length <= 8) {
    return timeString; // Trả về nguyên bản vì đã đúng format
  }

  // Nếu là datetime đầy đủ thì parse và format
  const parsedTime = moment(timeString);
  if (!parsedTime.isValid()) {
    console.error('Invalid date:', timeString);
    return 'Lỗi dữ liệu';
  }
  return parsedTime.format('HH:mm:ss');
};


// Hàm format ngày
const formatDate = (dateString) => {
  if (!dateString) return '';
  const parsedDate = moment(dateString, 'YYYY-MM-DD');
  if (!parsedDate.isValid()) {
    console.error('Invalid date:', dateString);
    return 'Lỗi dữ liệu';
  }
  return parsedDate.format('YYYY-MM-DD');
};


// Component hiển thị trạng thái với logic mới
const SessionInfo = ({ session, period }) => {
  const isLate = checkIsLate(session.checkIn, period);
  
  return (
    <div style={styles.sessionInfo}>
      <div style={styles.timeInfo}>
        <div>Vào: {session.checkIn || 'Chưa có dữ liệu'}</div>
        <div>Ra: {session.checkOut || 'Chưa có dữ liệu'}</div>
      </div>
      {session.checkIn && 
        <StatusBadge isLate={isLate} />
      }
    </div>
  );
};

// Hàm kiểm tra thời gian đi muộn
const checkIsLate = (checkInTime, period) => {
  if (!checkInTime) return false;
  
  // Parse time from HH:mm:ss format
  const [hours, minutes] = checkInTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  if (period === 'morning') {
    return timeInMinutes > TIME_CONSTANTS.WORKING_HOURS.MORNING.START;
  } else {
    return timeInMinutes > TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.START;
  }
};

const StatusBadge = ({ isLate }) => (
  <div style={{
    ...styles.badge,
    ...(isLate ? styles.lateBadge : styles.onTimeBadge)
  }}>
    {isLate ? 'Đi muộn' : 'Đúng giờ'}
  </div>
);

// Cập nhật AttendanceRow với logic mới
const AttendanceRow = ({ record }) => (
  <tr style={styles.tr}>
    <td style={styles.td}>{formatDate(record.date)}</td>
    <td style={styles.td}>
      <SessionInfo 
        session={{
          checkIn: record.morningSession?.checkIn,
          checkOut: record.morningSession?.checkOut,
          duration: record.morningSession?.duration
        }}
        period="morning"
      />
    </td>
    <td style={styles.td}>
      <SessionInfo 
        session={{
          checkIn: record.afternoonSession?.checkIn,
          checkOut: record.afternoonSession?.checkOut,
          duration: record.afternoonSession?.duration
        }}
        period="afternoon"
      />
    </td>
    <td style={styles.td}>
      <div style={styles.totalHours}>{record.totalHours || 'Chưa có dữ liệu'}</div>
    </td>
  </tr>
);

const AttendanceUser = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

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
  
      // Log raw data để debug
      console.log('Raw API response:', response.data);
  
      // Transform and validate the data
      const transformedHistory = (response.data.history || []).map(record => ({
        date: record.date,
        morningSession: {
          checkIn: record.morningSession?.checkIn || null,
          checkOut: record.morningSession?.checkOut || null,
          duration: record.morningSession?.duration || null
        },
        afternoonSession: {
          checkIn: record.afternoonSession?.checkIn || null,
          checkOut: record.afternoonSession?.checkOut || null,
          duration: record.afternoonSession?.duration || null
        },
        totalHours: record.totalHours || '0 giờ 0 phút'
      }));
  
      // Log transformed data để debug
      console.log('Transformed data:', transformedHistory);
  
      setAttendanceRecords(transformedHistory);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải dữ liệu';
      showAlert('error', 'Lỗi', errorMessage);
      console.error('Fetch error:', error);
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
      const response = await axios.post(
        `http://localhost:5000/api/auth/attendance/check-${type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data) {
        showAlert('success', `Check-${type} thành công!`, '');
        await fetchAttendance();
      }
    } catch (error) {
      showAlert('error', 'Lỗi', error.response?.data?.message || `Lỗi khi check-${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.card}>
        <h1 style={styles.title}>Chấm Công</h1>
        
        <div style={styles.buttonContainer}>
          <button
            onClick={() => handleAttendance('in')}
            style={{
              ...styles.button,
              ...styles.checkInButton,
              ...(loading && styles.disabledButton)
            }}
            disabled={loading}
          >
            Check-in
          </button>
          <button
            onClick={() => handleAttendance('out')}
            style={{
              ...styles.button,
              ...styles.checkOutButton,
              ...(loading && styles.disabledButton)
            }}
            disabled={loading}
          >
            Check-out
          </button>
        </div>

        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Ngày</th>
              <th style={styles.th}>Ca Sáng</th>
              <th style={styles.th}>Ca Chiều</th>
              <th style={styles.th}>Tổng Giờ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{...styles.td, textAlign: 'center'}}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record, index) => (
                <AttendanceRow key={record.date || index} record={record} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceUser;