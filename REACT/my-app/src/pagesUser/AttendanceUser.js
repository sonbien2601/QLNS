import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const AttendanceRow = ({ record }) => {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>{new Date(record.checkIn).toLocaleDateString()}</td>
      <td style={styles.tableCell}>{new Date(record.checkIn).toLocaleTimeString()}</td>
      <td style={styles.tableCell}>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Chưa check-out'}</td>
      <td style={styles.tableCell}>{record.totalHours || 'Chưa có thông tin'}</td>
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
          {attendanceRecords.map((record) => (
            <AttendanceRow key={record._id} record={record} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AttendanceUser = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/auth/attendance/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceRecords(response.data.history);
      const today = new Date().setHours(0, 0, 0, 0);
      const todayRecord = response.data.history.find(record => 
        new Date(record.checkIn).setHours(0, 0, 0, 0) === today && !record.checkOut
      );
      setIsCheckingOut(!!todayRecord);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu chấm công:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Không thể tải dữ liệu chấm công. Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/auth/attendance/check-in', null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAttendance();
      MySwal.fire({
        icon: 'success',
        title: 'Check-in thành công!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Lỗi khi check-in:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi khi check-in',
        text: error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
      });
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/auth/attendance/check-out', null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAttendance();
      MySwal.fire({
        icon: 'success',
        title: 'Check-out thành công!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Lỗi khi check-out:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi khi check-out',
        text: error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.',
      });
    }
  };

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.container}>
        <h2 style={styles.title}>Chấm Công Của Bạn</h2>
        <div style={styles.attendanceActions}>
          {isCheckingOut ? (
            <button onClick={handleCheckOut} style={styles.checkoutBtn}>Check-out</button>
          ) : (
            <button onClick={handleCheckIn} style={styles.checkinBtn}>Check-in</button>
          )}
        </div>
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
    marginBottom: '30px',
  },
  checkinBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#27ae60',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  checkoutBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
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
  },
};

export default AttendanceUser;