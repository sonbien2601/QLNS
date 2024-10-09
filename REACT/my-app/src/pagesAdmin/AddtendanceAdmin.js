import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';

const AttendanceRow = ({ record }) => {
  return (
    <tr>
      <td>{record.userId?.fullName || 'N/A'}</td>
      <td>{record.userId?.position || 'N/A'}</td>
      <td>{new Date(record.checkIn).toLocaleString()}</td>
      <td>{record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Chưa check-out'}</td>
      <td>{record.totalHours ? `${record.totalHours} ` : 'N/A'}</td>
    </tr>
  );
};

const AttendanceSummaryTable = ({ attendanceRecords }) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return <p>Không có dữ liệu chấm công</p>;
  }

  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Tên Nhân Viên</th>
          <th>Chức Vụ</th>
          <th>Thời Gian Check In</th>
          <th>Thời Gian Check Out</th>
          <th>Tổng Thời Gian Làm Việc</th>
        </tr>
      </thead>
      <tbody>
        {attendanceRecords.map((record) => (
          <AttendanceRow key={record._id} record={record} />
        ))}
      </tbody>
    </table>
  );
};

const AttendanceAdmin = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/auth/attendance/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Dữ liệu nhận được từ server:', response.data);
        
        if (Array.isArray(response.data.attendanceRecords)) {
          const validRecords = response.data.attendanceRecords.filter(record => record && record.userId);
          console.log('Số lượng bản ghi hợp lệ:', validRecords.length);
          setAttendanceRecords(validRecords);
        } else {
          console.error('Dữ liệu không phải là mảng:', response.data);
          setError('Dữ liệu không hợp lệ');
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu chấm công:', error);
        setError('Không thể lấy dữ liệu chấm công');
      }
    };

    fetchAttendance();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Tổng Hợp Chấm Công</h2>
        {attendanceRecords.length > 0 ? (
          <AttendanceSummaryTable attendanceRecords={attendanceRecords} />
        ) : (
          <p>Không có dữ liệu chấm công</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceAdmin;