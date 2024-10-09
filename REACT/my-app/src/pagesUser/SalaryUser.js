// pagesUser/SalaryUser.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

const SalaryUser = () => {
  const [salary, setSalary] = useState(null);

  useEffect(() => {
    const fetchSalary = async () => {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user'))._id; // Lấy ID người dùng từ localStorage
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/salary/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Kiểm tra xem salary có hợp lệ không
        if (response.data.salary) {
          setSalary(response.data.salary);
        } else {
          setSalary(null); // Nếu không có lương, đặt về null
        }
      } catch (error) {
        console.error('Lỗi khi lấy lương:', error);
        setSalary(null); // Đặt lại về null nếu có lỗi
      }
    };

    fetchSalary();
  }, []);

  return (
    <div className="main-container">
      <NavigationUser />
      <div className="content">
        <h2>Thông Tin Lương</h2>
        {salary ? (
          <div>
            <p><strong>Tên Nhân Viên:</strong> {salary.userId ? salary.userId.fullName : 'Không có tên nhân viên'}</p>
            <p><strong>Chức Vụ:</strong> {salary.userId ? salary.userId.position : 'Không có chức vụ'}</p>
            <p><strong>Lương Cơ Bản:</strong> {salary.basicSalary} VNĐ</p>
            <p><strong>Thưởng:</strong> {salary.bonus} VNĐ</p>
            <p><strong>Tổng Thu Nhập:</strong> {salary.totalSalary} VNĐ</p>
          </div>
        ) : (
          <p>Không có thông tin lương.</p>
        )}
      </div>
    </div>
  );
};

export default SalaryUser;
