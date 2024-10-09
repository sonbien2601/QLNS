import React from 'react';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

const Overview = () => {
  return (
    <div className="main-container">

      <NavigationUser /> {/* Hiển thị sidebar */}
      <div className="content">
        <h2>Tổng quan</h2>
        <div className="reminder-section">
          <div className="reminder-box">Nhân viên hết hạn hợp đồng</div>
          <div className="reminder-box">Nhân viên chưa ký hợp đồng</div>
          <div className="reminder-box">Công việc cần thực hiện</div>
          <div className="reminder-box">Sinh nhật nhân viên</div>
          <div className="reminder-box">Nhân viên đến tuổi nghỉ hưu</div>
          <div className="reminder-box">Nhân viên hết hạn bổ nhiệm</div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
