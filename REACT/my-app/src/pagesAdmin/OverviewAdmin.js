import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const OverviewAdmin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    expectedCompletionTime: '',
    assignedTo: ''
  });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [overviewData, setOverviewData] = useState({
    totalEmployees: 0,
    newEmployees: 0,
    activeEmployees: 0,
    contractTypes: {},
    staffChanges: [],
    staffCounts: [],
    attendanceRecords: [],
    salaries: [],
    approvedResignations: 0
  });

  const handleAddTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('http://localhost:5000/api/auth/tasks', newTask, { headers });
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        expectedCompletionTime: '',
        assignedTo: ''
      });
      alert(response.data.message);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi nhắc nhở. Vui lòng thử lại.');
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/auth/tasks', { headers });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [usersResponse, contractsResponse, attendanceResponse, salaryResponse, resignationsResponse, tasksResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/users', { headers }),
          axios.get('http://localhost:5000/api/auth/contracts', { headers }),
          axios.get('http://localhost:5000/api/auth/attendance/all', { headers }),
          axios.get('http://localhost:5000/api/auth/salary', { headers }),
          axios.get('http://localhost:5000/api/auth/resignation-requests', { headers }),
          axios.get('http://localhost:5000/api/auth/tasks', { headers })
        ]);

        const users = usersResponse.data.users;
        setUsers(users);
        const contracts = contractsResponse.data;
        const attendanceRecords = attendanceResponse.data.attendanceRecords;
        const salaries = salaryResponse.data.salaries;
        const resignations = resignationsResponse.data.resignations;
        setTasks(tasksResponse.data.tasks);

        const totalEmployees = users.length;
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const newEmployees = users.filter(user => new Date(user.createdAt) > threeDaysAgo).length;
        const activeEmployees = users.filter(user => user.status === 'active').length;

        const contractTypes = contracts.reduce((acc, contract) => {
          acc[contract.contractType] = (acc[contract.contractType] || 0) + 1;
          return acc;
        }, {});

        const approvedResignations = resignations.filter(resignation =>
          resignation.status === 'approved' &&
          new Date(resignation.processedAt).getMonth() === new Date().getMonth()
        ).length;

        const staffChanges = [
          { name: 'Tháng 1', nhận: 2, nghỉ: 1 },
          { name: 'Tháng 2', nhận: 3, nghỉ: 0 },
          { name: 'Tháng 3', nhận: 1, nghỉ: approvedResignations },
        ];

        const staffCounts = [
          { name: 'Tháng 1', số_lượng: totalEmployees - 2 },
          { name: 'Tháng 2', số_lượng: totalEmployees - 1 },
          { name: 'Tháng 3', số_lượng: totalEmployees - approvedResignations },
        ];

        setOverviewData({
          totalEmployees,
          newEmployees,
          activeEmployees,
          contractTypes,
          staffChanges,
          staffCounts,
          attendanceRecords,
          salaries,
          approvedResignations
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const contractData = Object.entries(overviewData.contractTypes).map(([name, value]) => ({ name, value }));

  return (
    <div className="overview-container">
      <div className="header">
        <div className="button-group">
          <button className="btn btn-primary">Báo cáo</button>
          <button className="btn btn-secondary" onClick={() => setShowTaskModal(true)}>Nhắc việc</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card new-employees">
          <h3>Nhân viên mới</h3>
          <div className="stat-value">{overviewData.newEmployees}</div>
          <div className="stat-previous">1-3 ngày qua</div>
        </div>
        <div className="stat-card successful-trials">
          <h3>Nhân viên của công ty</h3>
          <div className="stat-value">{overviewData.totalEmployees}</div>
          <div className="stat-previous">Tổng số nhân viên</div>
        </div>
        <div className="stat-card resignations">
          <h3>Nghỉ việc</h3>
          <div className="stat-value">{overviewData.approvedResignations}</div>
          <div className="stat-previous">Tháng này</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Thống kê hợp đồng theo loại</h3>
          <p className="chart-subtitle">Tất cả đơn vị - Năm 2024</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contractData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Cơ cấu công ty</h3>
          <p className="chart-subtitle">Tất cả đơn vị - Năm 2024</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overviewData.staffCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="số_lượng" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Nhắc việc</h3>
          <div className="task-list">
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task._id} className="task-item">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Ngày hết hạn: {new Date(task.dueDate).toLocaleDateString()}</p>
                  <p>Thời gian dự kiến hoàn thành: {task.expectedCompletionTime}</p>
                  <p>Người được giao: {task.assignedTo && task.assignedTo.fullName ? task.assignedTo.fullName : 'Chưa được gán'}</p>
                </div>
              ))
            ) : (
              <p>Không có nhắc việc nào.</p>
            )}
          </div>
        </div>
      </div>

      <div className="charts-grid two-columns">
        <div className="chart-card">
          <h3>Biến động nhân sự</h3>
          <p className="chart-subtitle">Tất cả đơn vị - Năm 2024</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overviewData.staffChanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nhận" fill="#8884d8" />
              <Bar dataKey="nghỉ" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Số lượng nhân sự</h3>
          <p className="chart-subtitle">Tất cả đơn vị - Năm 2024</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overviewData.staffCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="số_lượng" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showTaskModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Thêm nhắc việc mới</h2>
            <input
              type="text"
              placeholder="Tiêu đề"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <textarea
              placeholder="Mô tả"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
            <input
              type="time"
              value={newTask.expectedCompletionTime}
              onChange={(e) => setNewTask({ ...newTask, expectedCompletionTime: e.target.value })}
            />
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            >
              <option value="">Chọn nhân viên</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.fullName}</option>
              ))}
            </select>
            <div className="modal-buttons">
              <button onClick={handleAddTask}>Thêm</button>
              <button onClick={() => setShowTaskModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .overview-container {
          width: 100%;
          padding: 16px;
          background-color: #f3f4f6;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background-color: #d1d5db;
          color: #4b5563;
        }

        .stats-grid, .charts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .charts-grid.two-columns {
          grid-template-columns: repeat(2, 1fr);
        }

        .stat-card, .chart-card {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        .new-employees::before { background-color: #10b981; }
        .successful-trials::before { background-color: #3b82f6; }
        .resignations::before { background-color: #f59e0b; }

        .stat-card h3 {
          margin-top: 0;
          font-size: 1rem;
          color: #374151;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 8px 0;
        }

        .stat-previous {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .chart-card h3 {
          margin-top: 0;
          font-size: 1rem;
          color: #374151;
        }

        .chart-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .total-employees {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: right;
        }

        .employee-count {
          font-weight: bold;
          margin-left: 8px;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 300px;
        }

        .modal-content input,
        .modal-content textarea,
        .modal-content select {
          width: 100%;
          margin-bottom: 10px;
          padding: 5px;
        }

        .modal-buttons {
          display: flex;
          justify-content: space-between;
        }

        .task-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .task-item {
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 0;
        }

        .task-item:last-child {
          border-bottom: none;
        }

        .task-item h4 {
          margin: 0 0 5px 0;
          color: #3b82f6;
        }

        .task-item p {
          margin: 0 0 5px 0;
          font-size: 0.9em;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default OverviewAdmin;