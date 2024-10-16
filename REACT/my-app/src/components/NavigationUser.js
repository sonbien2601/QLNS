// components/NavigationUser.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/style.css';

const NavigationUser = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Lấy vai trò từ localStorage khi component được render
    const storedRole = localStorage.getItem('role');
    setRole(storedRole); // Lưu vai trò vào state
  }, []);

  return (
    <div className="user-sidebar">
      <ul className="user-sidebar-menu">
        {/* Hiển thị cho người dùng có vai trò 'user' */}
        {role === 'user' && (
          <>
            <li>
              <Link to="/user/overview-user">
                <i className="fas fa-file-contract"></i> Tổng quan
              </Link>
            </li>
            <li>
              <Link to="/user/view-contractuser">
                <i className="fas fa-file-contract"></i> Xem Hợp Đồng
              </Link>
            </li>
            <li>
              <Link to="/user/resignation-user">
                <i className="fas fa-user-tie"></i> Nghỉ việc
              </Link>
            </li>
            <li>
              <Link to="/user/appointment">
                <i className="fas fa-user-tie"></i> Yêu Cầu Bổ Nhiệm
              </Link>
            </li>
            <li>
              <Link to="/user/attendance">
                <i className="fas fa-clock"></i> Chấm Công
              </Link>
            </li>
            <li>
              <Link to="/user/salary">
                <i className="fas fa-dollar-sign"></i> Thông Tin Lương
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default NavigationUser;
