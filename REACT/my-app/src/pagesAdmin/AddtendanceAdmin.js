import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';

const AttendanceRow = ({ record }) => {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>{record.userId?.fullName || 'N/A'}</td>
      <td style={styles.tableCell}>{record.userId?.position || 'N/A'}</td>
      <td style={styles.tableCell}>{new Date(record.checkIn).toLocaleString()}</td>
      <td style={styles.tableCell}>{record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Chưa check-out'}</td>
      <td style={styles.tableCell}>{record.totalHours ? `${record.totalHours} ` : 'N/A'}</td>
    </tr>
  );
};

const AttendanceSummaryTable = ({ attendanceRecords }) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return <p style={styles.noData}>Không có dữ liệu chấm công</p>;
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Tên Nhân Viên</th>
            <th style={styles.tableHeader}>Chức Vụ</th>
            <th style={styles.tableHeader}>Thời Gian Check In</th>
            <th style={styles.tableHeader}>Thời Gian Check Out</th>
            <th style={styles.tableHeader}>Tổng Thời Gian Làm Việc</th>
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

const AttendanceAdmin = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const token = localStorage.getItem('token');
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/auth/attendance/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(response.data.attendanceRecords)) {
          const validRecords = response.data.attendanceRecords.filter(record => record && record.userId);
          setAttendanceRecords(validRecords);
        } else {
          setError('Dữ liệu không hợp lệ');
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu chấm công:', error);
        setError('Không thể lấy dữ liệu chấm công');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div style={styles.error}>Lỗi: {error}</div>;
  }

  return (
    <div style={styles.page}>
      <NavigationAdmin />
      <div style={styles.container}>
        <h2 style={styles.title}>Tổng Hợp Chấm Công</h2>
        {attendanceRecords.length > 0 ? (
          <AttendanceSummaryTable attendanceRecords={attendanceRecords} />
        ) : (
          <p style={styles.noData}>Không có dữ liệu chấm công</p>
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
  noData: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#7f8c8d',
    margin: '20px 0',
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

export default AttendanceAdmin;