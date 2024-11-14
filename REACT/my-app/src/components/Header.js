import { height } from '@fortawesome/free-solid-svg-icons/fa0';
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <img src="https://hrpartnering.vn/wp-content/uploads/2024/06/logo.jpg" alt="Logo" style={styles.logo} /> {/* Đặt đường dẫn đến ảnh logo */}
        <h1 style={styles.title}>HRM.VN</h1>
      </div>
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          <li style={styles.navItem}>
            <Link to="/login" style={styles.registerButton}>Đăng Nhập</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.2rem 2rem',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    width: '50px', // Kích thước logo
    height: '60px',
    marginLeft: '290px',
  },
  title: {
    marginLeft: '10px',
    fontSize: '1.5rem',
    color: '#2B91E8',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
  },
  navList: {
    listStyleType: 'none',
    display: 'flex',
    margin: 0,
    padding: 0,
    marginRight: '290px',
  },
  navItem: {
    marginLeft: '-0.5rem',
  },
  navLink: {
    textDecoration: 'none',
    color: '#0953B8', // Màu xanh cho link
    fontSize: '1rem',
    padding: '0.5rem',
    borderRadius: '5px',
    transition: 'color 0.3s',
  },
  registerButton: {
    padding: '0.8rem 0.5rem', // Giảm padding để nút nhỏ hơn
    width: '130px', // Thiết lập chiều rộng nhỏ hơn
    fontSize: '1.1rem', // Giảm kích thước chữ nếu cần
    backgroundColor: '#2B91E8',
    color: 'white', // Màu chữ xanh
    border: 'none',
    borderRadius: '999px', // Tạo hình dáng tròn cho nút
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Tạo bóng mờ cho nút
    transition: 'background-color 0.3s, color 0.3s',
  },
  loginButton: {
    padding: '0.8rem 0.5rem', // Giảm padding để nút nhỏ hơn
    width: '130px', // Thiết lập chiều rộng nhỏ hơn
    fontSize: '1.1rem', // Giảm kích thước chữ nếu cần
    backgroundColor: 'white',
    color: '#2B91E8', // Màu chữ xanh
    border: 'none',
    borderRadius: '999px', // Tạo hình dáng tròn cho nút
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Tạo bóng mờ cho nút
    transition: 'background-color 0.3s, color 0.3s',
  },
  introduceButton: {
    padding: '0.8rem 0.5rem', // Giảm padding để nút nhỏ hơn
    width: '130px', // Thiết lập chiều rộng nhỏ hơn
    fontSize: '1.1rem', // Giảm kích thước chữ nếu cần
    backgroundColor: 'white',
    color: '#2B91E8', // Màu chữ xanh
    border: 'none',
    borderRadius: '999px', // Tạo hình dáng tròn cho nút
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Tạo bóng mờ cho nút
    transition: 'background-color 0.3s, color 0.3s',
  },
};

export default Header;
