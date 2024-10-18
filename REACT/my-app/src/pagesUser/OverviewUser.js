import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import Swal from 'sweetalert2';

const OverviewUser = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({
    userInfo: {},
    attendanceRecords: [],
    salary: {},
    contract: {},
    tasks: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState({});
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const userId = localStorage.getItem('userId');

        const tasksResponse = await axios.get(`http://localhost:5000/api/auth/tasks/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fetchedTasks = tasksResponse.data.tasks;
        setTasks(fetchedTasks);

        const overdueTasks = fetchedTasks.filter(task => 
          new Date(task.dueDate) < new Date() && task.status !== 'completed'
        );

        if (overdueTasks.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Công việc quá hạn',
            text: `Bạn có ${overdueTasks.length} công việc đã quá hạn và chưa hoàn thành. Vui lòng kiểm tra và cập nhật trạng thái.`,
          });

          try {
            await axios.post('http://localhost:5000/api/auth/notify-admin-overdue-tasks', 
              { overdueTasks }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error notifying admin about overdue tasks:', error);
          }
        }

        const fetchSafely = async (url) => {
          try {
            const response = await axios.get(url, { headers });
            return response.data;
          } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
          }
        };

        const [attendanceData, salaryData, contractData, userData] = await Promise.all([
          fetchSafely(`http://localhost:5000/api/auth/attendance/history`),
          fetchSafely(`http://localhost:5000/api/auth/salary/${userId}`),
          fetchSafely(`http://localhost:5000/api/auth/user-contract/${userId}`),
          fetchSafely(`http://localhost:5000/api/auth/users`)
        ]);

        const userInfo = userData?.users?.find(user => user._id === userId) || {};

        setOverviewData({
          userInfo: {
            fullName: userInfo.fullName || 'N/A',
            position: userInfo.position || 'N/A',
            email: userInfo.email || 'N/A',
            phoneNumber: userInfo.phoneNumber || 'N/A',
            username: userInfo.username || 'N/A'
          },
          attendanceRecords: attendanceData?.history || [],
          salary: salaryData?.salary || {},
          contract: contractData || {},
          tasks: fetchedTasks
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
        setIsLoading(false);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.',
        });
      }
    };

    fetchData();
  }, []);

  


  const handleCompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/auth/tasks/${taskId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedTask = response.data.task;
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ));

      if (response.data.penalty) {
        Swal.fire({
          icon: 'warning',
          title: 'Công việc hoàn thành trễ hạn',
          text: `Công việc đã được đánh dấu hoàn thành, nhưng bị trễ hạn. Bạn bị phạt ${response.data.penalty.toLocaleString()} VND.`,
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Công việc đã được đánh dấu hoàn thành.',
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi cập nhật trạng thái công việc. Vui lòng thử lại sau.',
      });
    }
  };

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

  const formatDateTime = (dateTimeString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateTimeString).toLocaleString('vi-VN', options);
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
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task._id} className={`task-item slide-in-bottom ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'overdue' : ''}`}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Hạn chót: {formatDateTime(task.dueDate)}</p>
                  <p>Thời gian hoàn thành dự kiến: {task.expectedCompletionTime}</p>
                  <p>Trạng thái: {task.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</p>
                  {task.status !== 'completed' && (
                    <button onClick={() => handleCompleteTask(task._id)}>Đánh dấu hoàn thành</button>
                  )}
                  {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                    <p className="overdue-warning">Công việc đã quá hạn! Bạn có thể bị phạt.</p>
                  )}
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
          color: #2d3748;
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
          padding: 15px;
          margin-bottom: 10px;
          animation: slideInBottom 0.5s ease-out;
          background-color: #f7fafc;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .task-item:hover {
          background-color: #edf2f7;
          transform: translateY(-2px);
        }

        .task-item:last-child {
          border-bottom: none;
        }

        .task-item h4 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .task-item p {
          margin: 5px 0;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .task-item button {
          margin-top: 10px;
          padding: 8px 12px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .task-item button:hover {
          background-color: #4338ca;
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
          border-color: #4f46e5;
          outline: none;
        }

        .info-card button {
          padding: 10px 16px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .info-card button:hover {
          background-color: #4338ca;
          transform: translateY(-2px);
        }

        .info-card button[type="button"] {
          background-color: #9ca3af;
        }

        .info-card button[type="button"]:hover {
          background-color: #6b7280;
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

        .overdue-warning {
          color: #e74c3c;
          font-weight: bold;
        }

        .task-item.overdue {
          border: 2px solid #e74c3c;
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