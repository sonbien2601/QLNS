// pagesUser/AttendanceUser.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

// Component hiển thị từng dòng thông tin chấm công
const AttendanceRow = ({ record }) => {
  return (
    <tr>
      <td>{new Date(record.checkIn).toLocaleDateString()}</td>
      <td>{new Date(record.checkIn).toLocaleTimeString()}</td>
      <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Not checked out'}</td>
      <td>{record.totalHours || 'Chưa có thông tin'}</td>
    </tr>
  );
};

const AttendanceTable = ({ attendanceRecords }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Giờ Vào</th>
          <th>Giờ Ra</th>
          <th>Tổng Giờ Làm</th>
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

// Component chính: Trang chấm công dành cho user
const AttendanceUser = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
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
      alert('Check-in thành công');
    } catch (error) {
      console.error('Lỗi khi check-in:', error);
      alert(error.response?.data?.message || 'Lỗi khi check-in');
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/attendance/check-out', null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAttendance();
      alert('Check-out thành công');
    } catch (error) {
      console.error('Lỗi khi check-out:', error);
      alert(error.response?.data?.message || 'Lỗi khi check-out');
    }
  };

  return (
    <div className="main-container">
      <NavigationUser />
      <div className="content">
        <h2>Chấm Công Của Bạn</h2>
        <div className="attendance-actions">
          {isCheckingOut ? (
            <button onClick={handleCheckOut} className="checkout-btn">Check-out</button>
          ) : (
            <button onClick={handleCheckIn} className="checkin-btn">Check-in</button>
          )}
        </div>
        <h3>Lịch sử chấm công</h3>
        <AttendanceTable attendanceRecords={attendanceRecords} />
      </div>
    </div>
  );
};

export default AttendanceUser;
