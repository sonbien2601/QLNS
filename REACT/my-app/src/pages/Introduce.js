import React from 'react';
import backgroundImage from '../images/leu.jpg';
const Introduce = () => {
  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="form-container">
         
          <h1>BinSon HRM - Giải Pháp Quản Lý Nhân Sự Toàn Diện</h1>
          <p>
            BinSon HRM là một hệ thống quản trị nhân sự hiện đại, giúp bạn phát triển doanh nghiệp và quản lý nguồn lực
            hiệu quả. Với BinSon HRM, bạn có thể dễ dàng quản lý hồ sơ nhân viên, lương thưởng, hợp đồng lao động, và
            nhiều tính năng khác.
          </p>
          <h2>Các Tính Năng Chính</h2>
          <ul>
            <li>Quản lý hồ sơ nhân viên toàn diện</li>
            <li>Theo dõi chấm công và tính lương tự động</li>
            <li>Quản lý hợp đồng lao động và quá trình bổ nhiệm</li>
            <li>Đánh giá hiệu suất và phát triển nhân viên</li>
            <li>Tích hợp quản lý tuyển dụng và nghỉ việc</li>
          </ul>
          <p>
            BinSon HRM giúp doanh nghiệp của bạn tiết kiệm thời gian và công sức trong việc quản lý nhân sự, từ đó tập trung
            phát triển nhân lực và chiến lược kinh doanh dài hạn.
          </p>
          <button type="button" onClick={() => window.location.href='/register'}>Đăng Ký</button>
          <button type="button" onClick={() => window.location.href='/login'}>Đăng Nhập</button>
        </div>
        <div className="image-container">
        <img src="https://i.pinimg.com/564x/28/f6/2e/28f62e1d6a2bde1e6ac0ae86b7d008df.jpg" alt="Description" />
        </div>
      </div>
    </div>
  );
};

export default Introduce;
