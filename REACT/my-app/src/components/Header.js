import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <h1>BINSON.VN</h1>
      <nav>
        <ul>
          <li><Link to="/introduce">Giới thiệu</Link></li>  {/* Thêm link Giới thiệu */}
          <li><Link to="/register">Đăng ký</Link></li>
          <li><Link to="/login">Đăng nhập</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
