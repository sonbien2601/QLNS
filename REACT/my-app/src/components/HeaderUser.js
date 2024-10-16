import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const HeaderUser = () => {
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  // Lấy tên người dùng từ localStorage và thiết lập trong state
  useEffect(() => {
    const name = localStorage.getItem('fullName');
    if (name) {
      setFullName(name);
    }
  }, []);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    navigate('/login');
    window.location.reload();  // Tải lại trang để làm mới giao diện
  };

  return (
    <header>
      <h1>Quản lý nhân sự</h1>
      <div className="header-right">
        {fullName && <div className="welcome-message">Hello, {fullName}</div>}
        <button className="logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default HeaderUser;
