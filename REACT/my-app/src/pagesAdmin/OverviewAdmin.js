import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { X, AlertCircle, Trash2 } from 'lucide-react';

// Styled components
const PageContainer = styled(motion.div)`
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

const TaskGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
`;

const TaskCardBase = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1 1 calc(33.333% - 16px);
  min-width: 250px;
  min-height: 200px;
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    color: #374151;
  }

  div {
    margin-bottom: 8px;
  }

  p {
    margin: 4px 0;
    font-size: 0.875rem;
    color: #4b5563;
  }

  @media (max-width: 1024px) {
    flex: 1 1 calc(50% - 16px);
  }

  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const ScrollableList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 15px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const ListItem = styled.div`
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const ItemTitle = styled.strong`
  display: block;
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 5px;
`;

const ItemDetail = styled.span`
  display: block;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 3px;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 5px;
  color: white;
`;

const ViewMoreButton = styled.button`
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  width: 100%;
  transition: background-color 0.3s ease;
  border-radius: 4px;

  &:hover {
    background-color: #ebf5fb;
    text-decoration: underline;
  }
`;

const ExpiredContractCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const TrialEmployeesCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const AssignedTasksCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const OverdueTasksCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const EmployeeRewardsCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const EmployeeBirthdaysCard = styled(TaskCardBase)`
  ${ScrollableList} {
    max-height: 250px;
  }
`;

const NotificationBadge = styled.div`
  display: flex;
  align-items: center;
  background-color: #ef4444;
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-left: 16px;

  svg {
    margin-right: 8px;
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
  width: 90%; // Tăng chiều rộng
  max-width: 1200px; // Đặt chiều rộng tối đa
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
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

const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;

  &:hover {
    background-color: #c0392b;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  input {
    flex: 1;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #2c3e50;
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const CloseModalButton = styled.button`
  display: flex;
  width: 70px;
  align-items: center;
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-left: 500px;

  &:hover {
    background-color: #c0392b;
  }

  span {
    margin-left: 1px;
    font-size: 14px;
    font-weight: 600;
  }
`;

const TaskList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const TaskItem = styled.div`
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1 1 calc(25% - 15px); // Điều chỉnh này sẽ tạo ra 4 cột
    min-width: 250px; // Đảm bảo các item không bị quá nhỏ
    margin-bottom: 20px;


    @media (max-width: 1400px) {
      flex: 1 1 calc(33.333% - 15px); // 3 cột trên màn hình nhỏ hơn
    }

    @media (max-width: 1100px) {
      flex: 1 1 calc(50% - 15px); // 2 cột trên màn hình tablet
    }

    @media (max-width: 768px) {
      flex: 1 1 100%; // 1 cột trên màn hình mobile
    }
  `;

// Component functions
const ExpiredContracts = ({ contracts }) => (
  <ExpiredContractCard>
    <h3>Nhân viên hết hạn hợp đồng</h3>
    <ScrollableList>
      {contracts.length > 0 ? contracts.map((contract) => (
        <ListItem key={contract._id}>
          <ItemTitle>{contract.employeeId.fullName}</ItemTitle>
          <ItemDetail>Bắt đầu: {new Date(contract.startDate).toLocaleDateString()}</ItemDetail>
          <ItemDetail>Kết thúc: {new Date(contract.endDate).toLocaleDateString()}</ItemDetail>
          <Badge style={{ backgroundColor: '#e74c3c' }}>Hết hạn</Badge>
        </ListItem>
      )) : (
        <p>Không có nhân viên nào.</p>
      )}
    </ScrollableList>
  </ExpiredContractCard>
);

const TrialEmployees = ({ employees }) => (
  <TrialEmployeesCard>
    <h3>Nhân viên chưa ký hợp đồng</h3>
    <ScrollableList>
      {employees.length > 0 ? employees.map((employee) => (
        <ListItem key={employee._id}>
          <ItemTitle>{employee.fullName}</ItemTitle>
          <ItemDetail>Chức vụ: {employee.position || 'Chưa có'}</ItemDetail>
          <ItemDetail>Trạng thái: {employee.employeeType || 'Thử việc'}</ItemDetail>
          <ItemDetail>Email: {employee.email}</ItemDetail>
          <Badge
            style={{
              backgroundColor: '#f39c12'
            }}
          >
            Chưa ký hợp đồng
          </Badge>
        </ListItem>
      )) : (
        <p>Không có nhân viên chưa ký hợp đồng.</p>
      )}
    </ScrollableList>
  </TrialEmployeesCard>
);

const AssignedTasks = ({ tasks, onViewMore }) => (
  <AssignedTasksCard>
    <h3>Công việc đã giao</h3>
    <ScrollableList>
      {tasks.map((task, index) => (
        <ListItem key={index}>
          <ItemTitle>{task.title}</ItemTitle>
          <ItemDetail>{task.assignee}</ItemDetail>
          <ItemDetail>Hạn: {task.dueDate}</ItemDetail>
          <Badge style={{ backgroundColor: task.status === 'completed' ? '#2ecc71' : '#3498db' }}>
            {task.status}
          </Badge>
        </ListItem>
      ))}
    </ScrollableList>
    <ViewMoreButton onClick={onViewMore}>
      Xem tất cả ({tasks.length} công việc)
    </ViewMoreButton>
  </AssignedTasksCard>
);

const OverdueTasks = ({ tasks }) => (
  <OverdueTasksCard>
    <h3>Nhân viên trễ hạn công việc</h3>
    <ScrollableList>
      {tasks.length > 0 ? tasks.map((task) => (
        <ListItem key={task._id}>
          <ItemTitle>{task.assignedTo?.fullName || 'Chưa được gán'}</ItemTitle>
          <ItemDetail>Công việc: {task.title}</ItemDetail>
          <ItemDetail>Deadline: {new Date(task.dueDate).toLocaleString()}</ItemDetail>
          <ItemDetail>Hoàn thành: {new Date(task.completedAt).toLocaleString()}</ItemDetail>
          <Badge style={{ backgroundColor: '#e74c3c' }}>Trễ hạn</Badge>
        </ListItem>
      )) : (
        <p>Không có nhân viên nào trễ hạn công việc.</p>
      )}
    </ScrollableList>
  </OverdueTasksCard>
);

const EmployeeRewards = () => (
  <EmployeeRewardsCard>
    <h3>Khen thưởng nhân viên</h3>
    <ScrollableList>
      <p>Chưa có thông tin khen thưởng.</p>
    </ScrollableList>
  </EmployeeRewardsCard>
);

const EmployeeBirthdays = () => (
  <EmployeeBirthdaysCard>
    <h3>Sinh nhật nhân viên</h3>
    <ScrollableList>
      <p>Chưa có thông tin sinh nhật.</p>
    </ScrollableList>
  </EmployeeBirthdaysCard>
);

const AssignedTasksModal = ({ isOpen, onClose, tasks, users, setSelectedTask, setNewDeadline, setShowUpdateDeadlineModal, handleDeleteTask }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ModalContent
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
      >
        <ModalHeader>
          <h2>Công việc đã giao</h2>
          <CloseModalButton onClick={onClose}>
            <X size={24} />
            <span>Đóng</span>
          </CloseModalButton>
        </ModalHeader>
        <ModalBody>
          {tasks.length > 0 ? (
            <TaskGrid>
              {tasks.map(task => {
                const assignedUser = users.find(user => user._id === task.assignedTo);
                const dueDate = new Date(task.dueDate);
                return (
                  <TaskItem key={task._id}>
                    <div>
                      <h3>{task.title}</h3>
                      <p><strong>Mô tả:</strong> {task.description}</p>
                      <p><strong>Hạn chót:</strong> {dueDate.toLocaleString()}</p>
                      <p><strong>Người được giao:</strong> {assignedUser ? assignedUser.fullName : 'Chưa được gán'}</p>
                      <p><strong>Thưởng:</strong> {task.bonus || 'Không'}</p>
                      <p><strong>Phạt:</strong> {task.penalty || 'Không'}</p>
                      <p><strong>Trạng thái:</strong> {task.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</p>
                      {task.completedAt && (
                        <p><strong>Thời gian hoàn thành:</strong> {new Date(task.completedAt).toLocaleString()}</p>
                      )}
                    </div>
                    <ButtonContainer>
                      <Button
                        className="btn-primary"
                        onClick={() => {
                          setSelectedTask(task);
                          setNewDeadline({
                            date: dueDate.toISOString().split('T')[0],
                            time: dueDate.toTimeString().split(' ')[0].slice(0, 5)
                          });
                          setShowUpdateDeadlineModal(true);
                        }}
                      >
                        Cập nhật Deadline
                      </Button>
                      <DeleteButton
                        onClick={() => handleDeleteTask(task._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 size={16} />
                        Xóa
                      </DeleteButton>
                    </ButtonContainer>
                  </TaskItem>
                );
              })}
            </TaskGrid>
          ) : (
            <p>Chưa có công việc nào được giao.</p>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};




const OverviewAdmin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [expiredContracts, setExpiredContracts] = useState([]);
  const [trialEmployeesList, setTrialEmployeesList] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showUpdateDeadlineModal, setShowUpdateDeadlineModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAssignedTasksModal, setShowAssignedTasksModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newDeadline, setNewDeadline] = useState({ date: '', time: '' });
  const [uncompletedTasks, setUncompletedTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [tasksPreview, setTasksPreview] = useState([]);

  const formatCurrency = (value) => {
    // Remove non-digit characters
    const number = value.replace(/[^\d]/g, '');

    // Format with thousand separators
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
  };

  // Hàm parse giá trị tiền tệ thành số
  const parseCurrencyToNumber = (currencyString) => {
    if (!currencyString) return 0;
    return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
  };

  const handleCurrencyChange = (e, field, setNewTask) => {
    let value = e.target.value;

    // Xóa tất cả ký tự không phải số và "VND"
    value = value.replace(/[^\d]/g, '');

    // Nếu giá trị rỗng, set về rỗng
    if (!value) {
      setNewTask(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    // Format số với dấu chấm phân cách hàng nghìn
    const formattedValue = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

    setNewTask(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };


  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    expectedCompletionTime: '',
    assignedTo: '',
    bonus: '',
    penalty: ''
  });

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

  const handleTaskCardClick = () => {
    setActiveSection('task');
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title || !newTask.dueDate || !newTask.dueTime || !newTask.assignedTo) {
        Swal.fire({
          icon: 'error',
          title: 'Thông tin không đầy đủ',
          text: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
        });
        return;
      }

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const headers = { Authorization: `Bearer ${token}` };

      // Parse currency values to numbers before sending
      const taskData = {
        ...newTask,
        bonus: parseCurrencyToNumber(newTask.bonus),
        penalty: parseCurrencyToNumber(newTask.penalty),
        createdBy: userId,
        dueDate: `${newTask.dueDate}T${newTask.dueTime}:00`
      };

      const response = await axios.post('http://localhost:5000/api/auth/tasks', taskData, { headers });

      if (response.data && response.data.task) {
        setTasks(prevTasks => [...prevTasks, response.data.task]);

        // Reset form
        setNewTask({
          title: '',
          description: '',
          dueDate: '',
          dueTime: '',
          expectedCompletionTime: '',
          assignedTo: '',
          bonus: '',
          penalty: ''
        });

        Swal.fire({
          icon: 'success',
          title: 'Tạo nhắc việc thành công',
          showConfirmButton: false,
          timer: 1500
        });

        setShowTaskModal(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi thêm công việc.'
      });
    }
  };


  const handleDeleteTask = async (taskId) => {
    try {
      const result = await Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn không thể hoàn tác hành động này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Có, xóa nó!',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');

        await axios.delete(`http://localhost:5000/api/auth/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        setUncompletedTasks(prevUncompletedTasks =>
          prevUncompletedTasks.filter(task => task._id !== taskId)
        );

        Swal.fire(
          'Đã xóa!',
          'Công việc đã được xóa thành công.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      Swal.fire(
        'Lỗi!',
        'Không thể xóa công việc. Vui lòng thử lại sau.',
        'error'
      );
    }
  };

  const handleUpdateDeadline = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const updatedDueDate = `${newDeadline.date}T${newDeadline.time}:00`;

      const response = await axios.put(
        `http://localhost:5000/api/auth/tasks/${selectedTask._id}`,
        { dueDate: updatedDueDate },
        { headers }
      );

      if (response.status === 200) {
        const updatedTask = response.data.task;

        const updatedTasks = tasks.map(task =>
          task._id === updatedTask._id ? updatedTask : task
        );

        setTasks(updatedTasks);

        const currentDate = new Date();
        const newUncompletedTasks = updatedTasks.filter(task =>
          task.status !== 'completed' && new Date(task.dueDate) < currentDate
        );
        setUncompletedTasks(newUncompletedTasks);

        setShowUpdateDeadlineModal(false);

        Swal.fire(
          'Thành công',
          new Date(updatedDueDate) > currentDate
            ? 'Đã cập nhật deadline. Công việc không còn quá hạn.'
            : 'Đã cập nhật deadline, nhưng công việc vẫn quá hạn.',
          new Date(updatedDueDate) > currentDate ? 'success' : 'warning'
        );
      } else {
        throw new Error('Không thể cập nhật deadline');
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      Swal.fire('Lỗi', 'Không thể cập nhật deadline', 'error');
    }
  };

  const handleEditTask = async (taskId) => {
    const taskToEdit = tasks.find(task => task._id === taskId);
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`http://localhost:5000/api/auth/tasks/${editingTask._id}`, editingTask, { headers });

      setTasks(tasks.map(task =>
        task._id === editingTask._id ? editingTask : task
      ));

      Swal.fire('Thành công', 'Đã cập nhật công việc', 'success');
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      Swal.fire('Lỗi', 'Không thể cập nhật công việc', 'error');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
          'http://localhost:5000/api/auth/users',
          'http://localhost:5000/api/auth/contracts',
          'http://localhost:5000/api/auth/attendance/all',
          'http://localhost:5000/api/auth/salary',
          'http://localhost:5000/api/auth/resignation-requests',
          'http://localhost:5000/api/auth/tasks'
        ];

        const results = await Promise.allSettled(
          endpoints.map(endpoint => axios.get(endpoint, { headers }))
        );

        const processData = (response, defaultValue) =>
          response.status === 'fulfilled' ? response.value.data : defaultValue;

        const usersData = processData(results[0], { users: [] }).users;
        setUsers(usersData);

        const contracts = processData(results[1], []);
        const expiredContracts = contracts.filter(contract => contract.status === 'Hết hiệu lực');
        setExpiredContracts(expiredContracts);

        const trialEmployeesList = usersData.filter(user =>
          user.status === 'active' &&
          (
            (!user.contractType ||
              user.contractType === 'Chưa ký hợp đồng' ||
              user.contractType === undefined)
          )
        );
        setTrialEmployeesList(trialEmployeesList);

        const attendanceRecords = processData(results[2], { attendanceRecords: [] }).attendanceRecords;
        const salaries = processData(results[3], { salaries: [] }).salaries;
        const resignations = processData(results[4], { resignations: [] }).resignations;
        const tasksData = processData(results[5], { tasks: [] }).tasks;
        setTasks(tasksData);

        const tasksPreviewData = tasksData.slice(0, 3).map(task => ({
          title: task.title,
          assignee: task.assignedTo?.fullName || 'Chưa phân công',
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Chưa có hạn',
          status: task.status
        }));
        setTasksPreview(tasksPreviewData);

        const currentDate = new Date();
        const overdueTasksData = tasksData.filter(task =>
          task.status === 'completed' && new Date(task.completedAt) > new Date(task.dueDate)
        );
        setOverdueTasks(overdueTasksData);

        const uncompletedTasksData = tasksData.filter(task =>
          task.status !== 'completed' && new Date(task.dueDate) < currentDate
        );
        setUncompletedTasks(uncompletedTasksData);

        if (uncompletedTasksData.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Công việc chưa hoàn thành',
            text: `Có ${uncompletedTasksData.length} công việc đã quá hạn và chưa hoàn thành.`,
          });
        }

        const totalEmployees = usersData.length;
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const newEmployees = usersData.filter(user => new Date(user.createdAt) > threeDaysAgo).length;
        const activeEmployees = usersData.filter(user => user.status === 'active').length;
        const permanentEmployees = usersData.filter(user =>
          user.employeeType === 'Chính thức' &&
          user.status === 'active'
        ).length;
        const trialEmployees = usersData.filter(user =>
          user.employeeType === 'Thử việc' &&
          user.status === 'active'
        ).length;

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

        const completedTasks = tasksData.filter(task => task.status === 'completed');
        if (completedTasks.length > 0) {
          Swal.fire({
            icon: 'info',
            title: 'Thông báo',
            text: `Có ${completedTasks.length} công việc đã được hoàn thành.`,
          });
        }

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

  const contractData = Object.entries(overviewData.contractTypes).map(([name, value]) => ({
    name: name === 'undefined' ? 'Chưa ký hợp đồng' : name,
    value
  }));



  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <Header>
        <ButtonGroup>
          <Button
            as={motion.button}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveSection('overview')}
          >
            Báo cáo
          </Button>
          <Button
            as={motion.button}
            className="btn-secondary"
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveSection('task')}
          >
            Nhắc việc
          </Button>
          <Button
            as={motion.button}
            className="btn-third"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowTaskModal(true)}
          >
            Thêm công việc
          </Button>
        </ButtonGroup>

        {uncompletedTasks.length > 0 && (
          <NotificationBadge>
            <AlertCircle size={16} />
            {uncompletedTasks.length} công việc quá hạn
          </NotificationBadge>
        )}
      </Header>

      {activeSection === 'overview' && (
        <>
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
            <ChartCard>
              <h3>Phân tích nhân sự theo loại hợp đồng</h3>
              <ChartSubtitle>Tất cả đơn vị - Hiện tại</ChartSubtitle>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Toàn thời gian', value: users.filter(u => u.contractType === 'Toàn thời gian').length },
                    { name: 'Bán thời gian', value: users.filter(u => u.contractType === 'Bán thời gian').length },
                    { name: 'Tạm thời', value: users.filter(u => u.contractType === 'Tạm thời').length },
                    { name: 'Chưa ký', value: users.filter(u => !u.contractType).length }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#a8e6cf" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard>
  <h3>Thống kê lương và thưởng phạt</h3>
  <ChartSubtitle>Tất cả nhân viên - Tháng hiện tại</ChartSubtitle>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={overviewData.salaries
        .filter(salary => salary.userId) // Lọc bỏ dữ liệu không có userId
        .map(salary => ({
          name: salary.userId.fullName,
          'Lương cơ bản': salary.basicSalary || 0,
          'Thưởng': salary.taskBonus || 0,
          'Phạt': salary.taskPenalty || 0,
          'Tổng nhận': salary.totalSalary || 0
        }))}
      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        angle={-45}
        textAnchor="end"
        interval={0}
        height={80}
      />
      <YAxis
        tickFormatter={(value) =>
          new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            notation: 'compact'
          }).format(value)
        }
      />
      <Tooltip
        formatter={(value) =>
          new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
          }).format(value)
        }
      />
      <Legend />
      <Bar dataKey="Lương cơ bản" fill="#8884d8" />
      <Bar dataKey="Thưởng" fill="#82ca9d" />
      <Bar dataKey="Phạt" fill="#ff7675" />
      <Bar dataKey="Tổng nhận" fill="#74b9ff" />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>


            <ChartCard
              as={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.2 }}
              onClick={handleTaskCardClick}
              style={{ cursor: 'pointer' }}
            >
              <h3>Nhắc việc</h3>
              <TaskList>
                <AnimatePresence>
                  {tasks.length > 0 ? (
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
                        <p>Ngày và giờ hết hạn: {new Date(task.dueDate).toLocaleString()}</p>
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
            <ChartCard>
              <h3>Tỷ lệ chấm công</h3>
              <ChartSubtitle>Thống kê điểm danh tháng hiện tại</ChartSubtitle>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Đúng giờ', value: overviewData.attendanceRecords.filter(r => !r.morningSession.isLate && !r.afternoonSession.isLate).length },
                      { name: 'Đi muộn', value: overviewData.attendanceRecords.filter(r => r.morningSession.isLate || r.afternoonSession.isLate).length },
                      { name: 'Vắng mặt', value: overviewData.workingDays - overviewData.attendanceRecords.length }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#82ca9d" />
                    <Cell fill="#ffc658" />
                    <Cell fill="#ff7675" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard>
              <h3>Hiệu suất công việc</h3>
              <ChartSubtitle>Phân tích hoàn thành nhiệm vụ</ChartSubtitle>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Hoàn thành đúng hạn', value: tasks.filter(t => t.status === 'completed' && new Date(t.completedAt) <= new Date(t.dueDate)).length },
                      { name: 'Hoàn thành trễ', value: tasks.filter(t => t.status === 'completed' && new Date(t.completedAt) > new Date(t.dueDate)).length },
                      { name: 'Đang thực hiện', value: tasks.filter(t => t.status === 'pending').length }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#00b894" />
                    <Cell fill="#ff7675" />
                    <Cell fill="#74b9ff" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>


            <ChartCard
  style={{ 
    width: '100%', // Đảm bảo card sử dụng toàn bộ không gian có sẵn
    minWidth: '800px' // Đặt chiều rộng tối thiểu
  }}
>
  <h3>Tỷ lệ thực hiện công việc theo người</h3>
  <ChartSubtitle>Hiệu suất làm việc theo nhân viên</ChartSubtitle>
  <div style={{ width: '100%', overflowX: 'auto' }}> {/* Wrapper cho phép scroll ngang */}
    <div style={{ minWidth: '800px', height: '600px' }}> {/* Container cố định kích thước tối thiểu */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={users.map(user => ({
            name: user.fullName,
            'Tỷ lệ hoàn thành': Math.round(
              (tasks.filter(t => 
                t.assignedTo?._id === user._id && 
                t.status === 'completed' && 
                new Date(t.completedAt) <= new Date(t.dueDate)
              ).length / 
              tasks.filter(t => t.assignedTo?._id === user._id).length || 0) * 100
            ),
            'Số công việc được giao': tasks.filter(t => t.assignedTo?._id === user._id).length
          }))}
          margin={{ 
            top: 20, 
            right: 50,  // Tăng margin phải
            left: 50,   // Tăng margin trái
            bottom: 150 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            height={120}
            interval={0}
            tick={props => (
              <g transform={`translate(${props.x},${props.y})`}>
                <text
                  x={0}
                  y={0}
                  dy={16}
                  textAnchor="end"
                  fill="#666"
                  transform="rotate(-35)"
                  style={{ fontSize: '12px' }}
                >
                  {props.payload.value}
                </text>
              </g>
            )}
          />
          <YAxis 
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
          />
          <Tooltip />
          <Legend 
            verticalAlign="top"
            height={36}
          />
          <Line 
            type="monotone" 
            dataKey="Tỷ lệ hoàn thành"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Số công việc được giao"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</ChartCard>
          </ChartsGrid>
        </>
      )}

      {activeSection === 'task' && (
        <TaskGrid>
          <ExpiredContracts contracts={expiredContracts} />
          <TrialEmployees employees={trialEmployeesList} />
          <AssignedTasks
            tasks={tasksPreview}
            onViewMore={() => setShowAssignedTasksModal(true)}
          />
          <OverdueTasks tasks={overdueTasks} />
          <EmployeeRewards />
          <EmployeeBirthdays />
        </TaskGrid>
      )}

      <AnimatePresence>
        {showAssignedTasksModal && (
          <AssignedTasksModal
            isOpen={showAssignedTasksModal}
            onClose={() => setShowAssignedTasksModal(false)}
            tasks={tasks}
            users={users}
            setSelectedTask={setSelectedTask}
            setNewDeadline={setNewDeadline}
            setShowUpdateDeadlineModal={setShowUpdateDeadlineModal}
            handleDeleteTask={handleDeleteTask}
          />
        )}
      </AnimatePresence>

      {showUpdateDeadlineModal && (
        <Modal onClick={() => setShowUpdateDeadlineModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>Cập nhật Deadline</h2>
            <InputGroup>
              <Input
                type="date"
                value={newDeadline.date}
                onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
              />
              <Input
                type="time"
                value={newDeadline.time}
                onChange={(e) => setNewDeadline({ ...newDeadline, time: e.target.value })}
              />
            </InputGroup>
            <ModalButtons>
              <Button className="btn-primary" onClick={handleUpdateDeadline}>Cập nhật</Button>
              <Button className="btn-third" onClick={() => setShowUpdateDeadlineModal(false)}>Hủy</Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {showTaskModal && (
        <Modal onClick={() => setShowTaskModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>Thêm Công Việc Mới</h2>
            <Input
              type="text"
              placeholder="Tên công việc"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <TextArea
              placeholder="Mô tả công việc"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
            <InputGroup>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
              <Input
                type="time"
                value={newTask.dueTime}
                onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
              />
            </InputGroup>
            <Input
              type="text"
              placeholder="Tiền thưởng (VND)"
              value={newTask.bonus}
              onChange={(e) => handleCurrencyChange(e, 'bonus', setNewTask)}
              onFocus={(e) => {
                // Khi focus, hiển thị giá trị số thuần
                const numericValue = parseCurrencyToNumber(e.target.value);
                setNewTask(prev => ({
                  ...prev,
                  bonus: numericValue ? numericValue.toString() : ''
                }));
              }}
              onBlur={(e) => {
                // Khi blur, format lại theo định dạng tiền tệ
                if (e.target.value) {
                  handleCurrencyChange(e, 'bonus', setNewTask);
                }
              }}
            />

            <Input
              type="text"
              placeholder="Tiền phạt (VND)"
              value={newTask.penalty}
              onChange={(e) => handleCurrencyChange(e, 'penalty', setNewTask)}
              onFocus={(e) => {
                const numericValue = parseCurrencyToNumber(e.target.value);
                setNewTask(prev => ({
                  ...prev,
                  penalty: numericValue ? numericValue.toString() : ''
                }));
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  handleCurrencyChange(e, 'penalty', setNewTask);
                }
              }}
            />
            <ModalButtons>
              <Button className="btn-primary" onClick={handleAddTask}>Thêm Công Việc</Button>
              <Button className="btn-third" onClick={() => setShowTaskModal(false)}>Hủy</Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default OverviewAdmin;