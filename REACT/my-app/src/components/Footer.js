import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info Section */}
        <div className="footer-section company-info">
          <h4>Về Công Ty</h4>
          <p>
            Công ty quản lý nhân sự hàng đầu cung cấp các giải pháp hiệu quả
            giúp bạn quản lý và phát triển nguồn nhân lực một cách tối ưu.
          </p>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section quick-links">
          <h4>Liên Kết Nhanh</h4>
          <ul>
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/introduce">Giới thiệu</a></li>
            <li><a href="/register">Đăng ký</a></li>
            <li><a href="/login">Đăng nhập</a></li>
            <li><a href="/employees">Danh sách nhân viên</a></li>
          </ul>
        </div>

        {/* Contact Information Section */}
        <div className="footer-section contact-info">
          <h4>Liên Hệ</h4>
          <p>Email: info@binsonhrm.com</p>
          <p>Điện thoại: 0123 456 789</p>
          <p>Địa chỉ: 123 Đường ABC, Thành phố XYZ</p>
        </div>

        {/* Social Media Section */}
        <div className="footer-section social-media">
          <h4>Kết Nối Với Chúng Tôi</h4>
          <a href="https://facebook.com"><i className="fab fa-facebook"></i></a>
          <a href="https://twitter.com"><i className="fab fa-twitter"></i></a>
          <a href="https://linkedin.com"><i className="fab fa-linkedin"></i></a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 Công ty quản lý nhân sự. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
