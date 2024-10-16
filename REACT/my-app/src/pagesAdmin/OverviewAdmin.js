import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

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
    permanentEmployees: 0,
    trialEmployees: 0,
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
        const permanentEmployees = users.filter(user => user.employeeType === 'chính thức').length;
        const trialEmployees = users.filter(user => user.employeeType === 'thử việc').length;

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
          permanentEmployees,
          trialEmployees,
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
    return <LoadingContainer>Loading...</LoadingContainer>;
  }

  const contractData = Object.entries(overviewData.contractTypes).map(([name, value]) => ({ name, value }));

  return (
    <PageContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <Header>
        <ButtonGroup>
          <Button
            as={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            Báo cáo
          </Button>
          <Button
            as={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary"
            onClick={() => setShowTaskModal(true)}
          >
            Nhắc việc
          </Button>
        </ButtonGroup>
      </Header>

      <StatsGrid>
        <StatCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="new-employees"
        >
          <h3>Nhân viên mới</h3>
          <StatValue>{overviewData.newEmployees}</StatValue>
          <StatPrevious>1-3 ngày qua</StatPrevious>
        </StatCard>

        <StatCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
          className="permanent-employees"
        >
          <h3>Nhân viên chính thức</h3>
          <StatValue>{overviewData.permanentEmployees}</StatValue>
          <StatPrevious>Tổng số nhân viên chính thức</StatPrevious>
        </StatCard>
        <StatCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className="trial-employees"
        >
          <h3>Nhân viên thử việc</h3>
          <StatValue>{overviewData.trialEmployees}</StatValue>
          <StatPrevious>Tổng số nhân viên thử việc</StatPrevious>
        </StatCard>
        <StatCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.2 }}
          className="resignations"
        >
          <h3>Nghỉ việc</h3>
          <StatValue>{overviewData.approvedResignations}</StatValue>
          <StatPrevious>Tháng này</StatPrevious>
        </StatCard>
        <StatCard
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="total-employees"
        >
          <h3>Tổng số nhân viên</h3>
          <StatValue>{overviewData.totalEmployees}</StatValue>
          <StatPrevious>Tổng số nhân viên</StatPrevious>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <h3>Thống kê hợp đồng theo loại</h3>
          <ChartSubtitle>Tất cả đơn vị - Năm 2024</ChartSubtitle>
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
        </ChartCard>
        <ChartCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        >
          <h3>Cơ cấu công ty</h3>
          <ChartSubtitle>Tất cả đơn vị - Năm 2024</ChartSubtitle>
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
        </ChartCard>
        <ChartCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          <h3>Nhắc việc</h3>
          <TaskList>
            <AnimatePresence>
              {tasks && tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <TaskItem
                    key={task._id}
                    as={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <p>Ngày hết hạn: {new Date(task.dueDate).toLocaleDateString()}</p>
                    <p>Thời gian dự kiến hoàn thành: {task.expectedCompletionTime}</p>
                    <p>Người được giao: {task.assignedTo && task.assignedTo.fullName ? task.assignedTo.fullName : 'Chưa được gán'}</p>
                  </TaskItem>
                ))
              ) : (
                <p>Không có nhắc việc nào.</p>
              )}
            </AnimatePresence>
          </TaskList>
        </ChartCard>
      </ChartsGrid>

      <ChartsGrid className="two-columns">
        <ChartCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.2 }}
        >
          <h3>Biến động nhân sự</h3>
          <ChartSubtitle>Tất cả đơn vị - Năm 2024</ChartSubtitle>
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
        </ChartCard>
        <ChartCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.2 }}
        >
          <h3>Số lượng nhân sự</h3>
          <ChartSubtitle>Tất cả đơn vị - Năm 2024</ChartSubtitle>
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
        </ChartCard>
      </ChartsGrid>

      <AnimatePresence>
        {showTaskModal && (
          <Modal
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ModalContent
              as={motion.div}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2>Thêm nhắc việc mới</h2>
              <Input
                type="text"
                placeholder="Tiêu đề"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <TextArea
                placeholder="Mô tả"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
              <Input
                type="time"
                value={newTask.expectedCompletionTime}
                onChange={(e) => setNewTask({ ...newTask, expectedCompletionTime: e.target.value })}
              />
              <Select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              >
                <option value="">Chọn nhân viên</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.fullName}</option>
                ))}
              </Select>
              <ModalButtons>
                <Button
                  className="btn-primary"
                  as={motion.button}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  onClick={handleAddTask}
                >
                  Thêm
                </Button>
                <Button
                  className="btn-third"
                  as={motion.button}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => setShowTaskModal(false)}
                >
                  Hủy
                </Button>
              </ModalButtons>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled.div`
  width: 100%;
  padding: 16px;
  background-color: #f3f4f6;
  min-height: 100vh;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #4b5563;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;

  button {
    white-space: nowrap;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }

  &.new-employees::before { background-color: #10b981; }
  &.total-employees::before { background-color: #3b82f6; }
  &.permanent-employees::before { background-color: #6366f1; }
  &.trial-employees::before { background-color: #f59e0b; }
  &.resignations::before { background-color: #ef4444; }

  h3 {
    margin-top: 0;
    font-size: 1rem;
    color: #374151;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin: 8px 0;
`;

const StatPrevious = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  &.two-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    font-size: 1rem;
    color: #374151;
  }
`;

const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 16px;
`;

const TaskList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const TaskItem = styled.div`
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 0;

  &:last-child {
    border-bottom: none;
  }

  h4 {
    margin: 0 0 5px 0;
    color: #3b82f6;
  }

  p {
    margin: 0 0 5px 0;
    font-size: 0.9em;
    color: #4b5563;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);

  h2 {
    margin-top: 0;
    margin-bottom: 25px;
    color: #2c3e50;
    font-size: 1.8rem;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
  }
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: 20px;
  padding: 12px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  &::placeholder {
    font-size: 16px;
    color: #b0b0b0;
  }

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  margin-bottom: 20px;
  padding: 12px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  &::placeholder {
    font-size: 16px;
    color: #b0b0b0;
  }
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  margin-bottom: 20px;
  padding: 12px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  font-size: 16px;
  background-color: white;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 15px top 50%;
  background-size: 12px auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 25px;
`;

const Button = styled(motion.button)`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.btn-primary {
    background-color: #3498db;
    color: white;
    &:hover {
      background-color: #2980b9;
    }
  }

   &.btn-secondary {
    background-color: #ecf0f1;
    color: #34495e;
    &:hover {
      background-color: #bdc3c7;
    }
  }

  &.btn-third {
    background-color: #e74c3c;
    color: white;
    &:hover {
      background-color: #c0392b;
    }
  }
`;

export default OverviewAdmin;