import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';

const OverviewUser = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState({
    userInfo: {},
    attendanceRecords: [],
    salary: {},
    contract: {},
    tasks: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const userId = localStorage.getItem('userId');

        const [attendanceResponse, salaryResponse, contractResponse, tasksResponse, userResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/attendance/history`, { headers }),
          axios.get(`http://localhost:5000/api/auth/salary/${userId}`, { headers }),
          axios.get(`http://localhost:5000/api/auth/user-contract/${userId}`, { headers }),
          axios.get(`http://localhost:5000/api/auth/tasks/${userId}`, { headers }),
          axios.get(`http://localhost:5000/api/auth/users`, { headers })
        ]);

        const userInfo = userResponse.data.users.find(user => user._id === userId) || {};

        setOverviewData({
          userInfo: {
            fullName: userInfo.fullName || 'N/A',
            position: userInfo.position || 'N/A',
            email: userInfo.email || 'N/A',
            phoneNumber: userInfo.phoneNumber || 'N/A',
            username: userInfo.username || 'N/A'
          },
          attendanceRecords: attendanceResponse.data.history || [],
          salary: salaryResponse.data.salary || {},
          contract: contractResponse.data || {},
          tasks: tasksResponse.data.tasks || []
        });

        setEditedUserInfo({
          fullName: userInfo.fullName || '',
          email: userInfo.email || '',
          phoneNumber: userInfo.phoneNumber || '',
          username: userInfo.username || ''
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const userId = localStorage.getItem('userId');

      await axios.put(`http://localhost:5000/api/auth/admin/user/${userId}`, editedUserInfo, { headers });

      setOverviewData(prev => ({
        ...prev,
        userInfo: {
          ...prev.userInfo,
          ...editedUserInfo
        }
      }));

      setIsEditing(false);
      Swal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        text: 'Thông tin cá nhân đã được cập nhật.',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error updating user info:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.',
      });
    }
  };

  if (isLoading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const attendanceData = overviewData.attendanceRecords.slice(0, 7).map(record => {
    let hours = 0;
    if (record.totalHours) {
      const match = record.totalHours.match(/(\d+)/);
      if (match) {
        hours = parseFloat(match[0]);
      }
    }
    return {
      date: new Date(record.checkIn).toLocaleDateString(),
      hours: hours
    };
  });
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="overview-container">
      <div className="header fade-in">
        <h1>Xin chào, {overviewData.userInfo.fullName}</h1>
      </div>

      <div className="user-info-grid">
        <div className="info-card slide-in-left">
          <h3>Thông tin cá nhân</h3>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="fade-in">
              <input
                type="text"
                name="fullName"
                value={editedUserInfo.fullName}
                onChange={handleInputChange}
                placeholder="Họ tên"
              />
              <input
                type="email"
                name="email"
                value={editedUserInfo.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
              <input
                type="text"
                name="phoneNumber"
                value={editedUserInfo.phoneNumber}
                onChange={handleInputChange}
                placeholder="Số điện thoại"
              />
              <input
                type="text"
                name="username"
                value={editedUserInfo.username}
                onChange={handleInputChange}
                placeholder="Tên đăng nhập"
              />
              <input
                type="password"
                name="password"
                onChange={handleInputChange}
                placeholder="Mật khẩu mới (để trống nếu không đổi)"
              />
              <button type="submit">Lưu</button>
              <button type="button" onClick={handleEditToggle}>Hủy</button>
            </form>
          ) : (
            <div className="fade-in">
              <p>Họ tên: {overviewData.userInfo.fullName}</p>
              <p>Chức vụ: {overviewData.userInfo.position}</p>
              <p>Email: {overviewData.userInfo.email}</p>
              <p>Số điện thoại: {overviewData.userInfo.phoneNumber}</p>
              <p>Tên đăng nhập: {overviewData.userInfo.username}</p>
              <button onClick={handleEditToggle}>Chỉnh sửa</button>
            </div>
          )}
        </div>
        <div className="info-card slide-in-top">
          <h3>Thông tin hợp đồng</h3>
          <p>Loại hợp đồng: {overviewData.contract.contractType || 'N/A'}</p>
          <p>Ngày bắt đầu: {overviewData.contract.startDate ? new Date(overviewData.contract.startDate).toLocaleDateString() : 'N/A'}</p>
          <p>Ngày kết thúc: {overviewData.contract.endDate ? new Date(overviewData.contract.endDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="info-card slide-in-right">
          <h3>Thông tin lương</h3>
          <p>Lương cơ bản: {overviewData.salary.basicSalary?.toLocaleString() || 'N/A'} VND</p>
          <p>Thưởng: {overviewData.salary.bonus?.toLocaleString() || 'N/A'} VND</p>
          <p>Tổng lương: {overviewData.salary.totalSalary?.toLocaleString() || 'N/A'} VND</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card fade-in">
          <h3>Thống kê chấm công</h3>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#10b981' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Không có dữ liệu chấm công.</p>
          )}
        </div>
        <div className="chart-card fade-in">
          <h3>Nhắc việc</h3>
          {overviewData.tasks.length > 0 ? (
            <ul className="task-list">
              {overviewData.tasks.map((task, index) => (
                <li key={index} className="task-item slide-in-bottom">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Hạn chót: {formatDate(task.dueDate)}</p>
                  <p>Thời gian hoàn thành dự kiến: {task.expectedCompletionTime}</p>
                  <p>Thời gian tạo: {formatDate(task.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có nhắc việc nào.</p>
          )}
        </div>
      </div>

      <style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInLeft {
    from { transform: translateX(-50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInRight {
    from { transform: translateX(50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInTop {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInBottom {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .overview-container {
    width: 100%;
    padding: 20px;
    background: linear-gradient(135deg, #e2e8f0, #edf2f7);
    min-height: 100vh;
    font-family: 'Arial', sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    animation: fadeIn 0.5s ease-out;
  }

  .user-info-grid, .charts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-card, .chart-card {
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .info-card:hover, .chart-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .info-card h3, .chart-card h3 {
    color: #2d3748; /* Darker color for headings */
    margin-bottom: 15px;
    font-size: 1.4rem;
  }

  .task-list {
    list-style-type: none;
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
  }

  .task-item {
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 0;
    animation: slideInBottom 0.5s ease-out;
    background-color: #f7fafc; /* Light background for tasks */
    border-radius: 6px;
  }

  .task-item:last-child {
    border-bottom: none;
  }

  .task-item h4 {
    margin: 0 0 5px 0;
    color: #4a5568; /* Darker text for task title */
  }

  .task-item p {
    margin: 5px 0;
    color: #718096; /* Lighter text for task details */
  }

  .info-card form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-card input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    transition: border 0.3s;
  }

  .info-card input:focus {
    border-color: #4f46e5; /* Highlight border on focus */
    outline: none;
  }

  .info-card button {
    padding: 10px 16px;
    background-color: #4f46e5; /* Primary button color */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }

  .info-card button:hover {
    background-color: #4338ca; /* Darker shade on hover */
    transform: translateY(-2px);
  }

  .info-card button[type="button"] {
    background-color: #9ca3af; /* Secondary button color */
  }

  .info-card button[type="button"]:hover {
    background-color: #6b7280; /* Darker shade on hover */
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  .slide-in-left {
    animation: slideInLeft 0.5s ease-out;
  }

  .slide-in-right {
    animation: slideInRight 0.5s ease-out;
  }

  .slide-in-top {
    animation: slideInTop 0.5s ease-out;
  }

  .slide-in-bottom {
    animation: slideInBottom 0.5s ease-out;
  }

  .loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: #4b5563;
    animation: fadeIn 0.5s ease-out;
  }

  @media (max-width: 768px) {
    .user-info-grid, .charts-grid {
      grid-template-columns: 1fr;
    }
  }
`}</style>
    </div>
  );
};

export default OverviewUser;