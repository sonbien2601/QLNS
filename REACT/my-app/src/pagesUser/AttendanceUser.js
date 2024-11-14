import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import moment from 'moment';
import 'moment/locale/vi';

const MySwal = withReactContent(Swal);

// Constants
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

// Helper Functions
const formatTime = (timeString) => {
  if (!timeString) return null;
  try {
    // Nếu timeString đã ở định dạng HH:mm:ss
    if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }

    // Nếu là ISO date string
    const time = moment(timeString);
    if (time.isValid()) {
      return time.format('HH:mm:ss');
    }

    return null;
  } catch (error) {
    console.error('Error formatting time:', error);
    return null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const parsedDate = moment(dateString, 'YYYY-MM-DD');
  if (!parsedDate.isValid()) {
    console.error('Invalid date:', dateString);
    return 'Lỗi dữ liệu';
  }
  return parsedDate.format('YYYY-MM-DD');
};

const formatWorkTime = (duration) => {
  if (!duration) return '0 giờ 0 phút';
  const [hours, minutes] = duration.split(' giờ ');
  return `${hours} giờ ${minutes.replace(' phút', '')} phút`;
};

// Components
const SessionInfo = ({ session, period }) => {
  const { isLate, minutes } = checkIsLate(session.checkIn, period);

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '0 giờ 0 phút';

    try {
      // Parse thời gian từ format HH:mm:ss
      const [inHours, inMinutes] = checkIn.split(':').map(Number);
      const [outHours, outMinutes] = checkOut.split(':').map(Number);

      // Tính toán thời gian làm việc bằng phút
      const startMinutes = inHours * 60 + inMinutes;
      const endMinutes = outHours * 60 + outMinutes;
      const duration = endMinutes - startMinutes;

      // Convert thành giờ và phút
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;

      return `${hours} giờ ${minutes} phút`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '0 giờ 0 phút';
    }
  };

  // Sử dụng workingTime từ API nếu có, nếu không thì tính toán
  const duration = session.workingTime || calculateDuration(session.checkIn, session.checkOut);

  // Log để debug
  console.log('Session calculation:', {
    checkIn: session.checkIn,
    checkOut: session.checkOut,
    calculatedDuration: calculateDuration(session.checkIn, session.checkOut),
    apiWorkingTime: session.workingTime,
    finalDuration: duration
  });

  return (
    <div style={styles.sessionInfo}>
      <div style={styles.timeInfo}>
        <div>Vào: {session.checkIn || 'Chưa có dữ liệu'}</div>
        <div>Ra: {session.checkOut || 'Chưa có dữ liệu'}</div>
        <div>Thời gian: {duration}</div>
        {isLate && minutes > 0 && (
          <div style={styles.latePenaltyInfo}>
            <span>Đi muộn {minutes} phút</span>
          </div>
        )}
      </div>
      {session.checkIn && <StatusBadge isLate={isLate} minutes={minutes} />}
    </div>
  );
};



const checkIsLate = (checkInTime, period) => {
  if (!checkInTime) return { isLate: false, minutes: 0 };

  const [hours, minutes] = checkInTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  if (period === 'morning') {
    const expectedTime = TIME_CONSTANTS.WORKING_HOURS.MORNING.START;
    const lateMinutes = Math.max(0, timeInMinutes - (expectedTime + TIME_CONSTANTS.WORKING_HOURS.MORNING.BUFFER));
    return {
      isLate: lateMinutes > 0,
      minutes: lateMinutes
    };
  } else {
    const expectedTime = TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.START;
    const lateMinutes = Math.max(0, timeInMinutes - (expectedTime + TIME_CONSTANTS.WORKING_HOURS.AFTERNOON.BUFFER));
    return {
      isLate: lateMinutes > 0,
      minutes: lateMinutes
    };
  }
};

const StatusBadge = ({ isLate, minutes }) => (
  <div style={{
    ...styles.badge,
    ...(isLate ? styles.lateBadge : styles.onTimeBadge)
  }}>
    {isLate ? `Đi muộn ${minutes} phút` : 'Đúng giờ'}
  </div>
);

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const MonthlyStats = ({ stats }) => (
  <div style={styles.monthlyStats}>
    <div style={styles.statsTitle}>Thống kê tháng</div>
    <div style={styles.statsGrid}>
      <div style={styles.statItem}>
        <span>Tổng giờ làm việc:</span>
        <span>{stats.totalHours || '0 giờ 0 phút'}</span>
      </div>
      <div style={styles.statItem}>
        <span>Số giờ chuẩn:</span>
        <span>{stats.standardHours || '0 giờ 0 phút'}</span>
      </div>
      <div style={styles.statItem}>
        <span>Số ngày đi muộn:</span>
        <span style={styles.lateCount}>
          {`${stats.lateDays || 0} ngày`}
        </span>
      </div>
      <div style={styles.statItem}>
        <span>Tổng phạt đi muộn:</span>
        <span style={styles.latePenalty}>
          -{formatCurrency(stats.latePenalty || 0)}
        </span>
      </div>
      <div style={styles.statItem}>
        <span>Tỷ lệ làm việc:</span>
        <span>{`${stats.workRatio || 0}%`}</span>
      </div>
    </div>
  </div>
);

const AttendanceRow = ({ record }) => {
  const calculateTotalDailyTime = () => {
    const morningMinutes = record.morningSession?.checkIn && record.morningSession?.checkOut ?
      calculateMinutes(record.morningSession.checkIn, record.morningSession.checkOut) : 0;

    const afternoonMinutes = record.afternoonSession?.checkIn && record.afternoonSession?.checkOut ?
      calculateMinutes(record.afternoonSession.checkIn, record.afternoonSession.checkOut) : 0;

    const totalMinutes = morningMinutes + afternoonMinutes;
    return formatDuration(totalMinutes);
  };

  const calculateMinutes = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);

    return (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
  };

  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} giờ ${minutes} phút`;
  };

  // Log để debug
  console.log('Row data:', {
    date: record.date,
    morning: {
      checkIn: record.morningSession?.checkIn,
      checkOut: record.morningSession?.checkOut,
      duration: record.morningSession?.workingTime
    },
    afternoon: {
      checkIn: record.afternoonSession?.checkIn,
      checkOut: record.afternoonSession?.checkOut,
      duration: record.afternoonSession?.workingTime
    },
    calculatedTotal: calculateTotalDailyTime(),
    apiTotal: record.workingHours?.daily
  });

  return (
    <tr style={styles.tr}>
      <td style={styles.td}>{formatDate(record.date)}</td>
      <td style={styles.td}>
        <SessionInfo
          session={{
            checkIn: record.morningSession?.checkIn,
            checkOut: record.morningSession?.checkOut,
            workingTime: record.morningSession?.workingTime
          }}
          period="morning"
        />
      </td>
      <td style={styles.td}>
        <SessionInfo
          session={{
            checkIn: record.afternoonSession?.checkIn,
            checkOut: record.afternoonSession?.checkOut,
            workingTime: record.afternoonSession?.workingTime
          }}
          period="afternoon"
        />
      </td>
      <td style={styles.td}>
        <div style={styles.totalHours}>
          <div>Ngày: {calculateTotalDailyTime()}</div>
          <div>Tháng: {record.workingHours?.monthly || '0 giờ 0 phút'}</div>
        </div>
      </td>
    </tr>
  );
};

// Main Component
const AttendanceUser = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment().month() + 1);
  const [currentYear, setCurrentYear] = useState(moment().year());
  const [monthlyStats, setMonthlyStats] = useState(null);

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
        params: { month: currentMonth, year: currentYear }
      });

      console.log('Raw API response:', response.data);

      setAttendanceRecords(response.data.history || []);
      setMonthlyStats(response.data.monthlyStats || null);
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
  }, [currentMonth, currentYear]);

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
        {
          month: currentMonth,
          year: currentYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
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

        <div style={styles.monthSelector}>
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            style={styles.select}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
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

        {monthlyStats && <MonthlyStats stats={monthlyStats} />}

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
                <td colSpan="4" style={{ ...styles.td, textAlign: 'center' }}>
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


const styles = {
  monthSelector: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center'
  },
  select: {
    padding: '0.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none'
  },
  monthlyStats: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  statsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
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

export default AttendanceUser;