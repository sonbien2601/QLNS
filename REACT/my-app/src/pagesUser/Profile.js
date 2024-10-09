import React from 'react';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

const Profile = () => {
  // Data for the pie chart
  const maleCount = 1; // Example data
  const femaleCount = 10; // Example data
  const total = maleCount + femaleCount;

  // Calculate percentages for pie chart
  const malePercentage = (maleCount / total) * 100;
  const femalePercentage = (femaleCount / total) * 100;

  // Calculate stroke dasharray values
  const maleDasharray = (malePercentage * 440) / 100; // Circumference of the circle (2 * π * r) where r = 70
  const femaleDasharray = (femalePercentage * 440) / 100;

  return (
    <div id="profile-content" className="profile-container">
      <NavigationUser />
      <div className="content">
        <h2>Hồ sơ</h2>
        <div className="status-summary">
          <div className="status-box">
            <h3>Đang làm việc</h3>
            <p>{total}</p>
          </div>
          <div className="status-box">
            <h3>Phân loại theo:</h3>
            <p>{maleCount} Nam</p>
            <p>{femaleCount} Nữ</p>
          </div>
        </div>

        <div className="chart-section">
          <h3>Biểu đồ phân loại giới tính</h3>
          <div className="pie-chart">
            <svg width="150" height="150">
              <circle cx="75" cy="75" r="70" fill="none" stroke="lightgray" strokeWidth="10" />
              <circle
                cx="75"
                cy="75"
                r="70"
                fill="none"
                stroke="blue"
                strokeWidth="10"
                strokeDasharray={`${maleDasharray} ${440 - maleDasharray}`}
                strokeDashoffset="0"
              />
              <circle
                cx="75"
                cy="75"
                r="70"
                fill="none"
                stroke="green"
                strokeWidth="10"
                strokeDasharray={`${femaleDasharray} ${440 - femaleDasharray}`}
                strokeDashoffset={maleDasharray}
              />
            </svg>
          </div>
        </div>

        <div className="status-buttons">
          <button className="status-btn">Thử việc</button>
          <button className="status-btn">Chính thức</button>
          <button className="status-btn">Nghỉ thai sản</button>
          <button className="status-btn">Khác</button>
        </div>

        <div className="search-container">
          <input type="text" placeholder="Tìm kiếm hồ sơ" />
        </div>
      </div>
    </div>
  );
};

export default Profile;
