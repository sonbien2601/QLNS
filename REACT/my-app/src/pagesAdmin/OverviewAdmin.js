import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { X, AlertCircle, Trash2 } from 'lucide-react';

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


  const handleTaskCardClick = () => {
    setActiveSection('task');
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

  const handleAddTask = async () => {
    try {
      if (!newTask.title || !newTask.dueDate || !newTask.dueTime || !newTask.assignedTo) {
        Swal.fire({
          icon: 'error',
          title: 'Thông tin không đầy đủ',
          text: 'Vui lòng điền đầy đủ thông tin bắt buộc: Tên công việc, Ngày hết hạn, Giờ hết hạn và Người được giao.',
        });
        return;
      }
  
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId'); // Lấy userId từ localStorage
      const headers = { Authorization: `Bearer ${token}` };
  
      const taskData = {
        ...newTask,
        createdBy: userId, // Thêm trường createdBy vào dữ liệu gửi đi
        dueDate: `${newTask.dueDate}T${newTask.dueTime}:00` // Kết hợp ngày và giờ
      };
  
      console.log('Sending task data:', taskData);
  
      const response = await axios.post('http://localhost:5000/api/auth/tasks', taskData, { headers });
  
      console.log('Server response:', response.data);
  
      if (response.data && response.data.task) {
        setTasks(prevTasks => [...prevTasks, response.data.task]);
  
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
          text: 'Công việc mới đã được thêm vào danh sách.',
          showConfirmButton: false,
          timer: 1500
        });
  
        setShowTaskModal(false);
      } else {
        throw new Error('Thêm công việc không thành công');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Có lỗi xảy ra khi thêm công việc. Vui lòng thử lại.';
      let errorDetails = '';
  
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = JSON.stringify(error.response.data, null, 2);
      }
  
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage,
        footer: `<pre>${errorDetails}</pre>`,
        customClass: {
          footer: 'error-details'
        }
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
        
        // Send delete request to the backend
        await axios.delete(`http://localhost:5000/api/auth/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // If the delete request is successful, update the frontend state
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));

        // Update uncompleted tasks
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
  
      // Tạo timestamp của deadline mới
      const updatedDueDate = `${newDeadline.date}T${newDeadline.time}:00`;
  
      // Gửi yêu cầu cập nhật deadline đến server
      const response = await axios.put(
        `http://localhost:5000/api/auth/tasks/${selectedTask._id}`,
        { dueDate: updatedDueDate },
        { headers }
      );
  
      if (response.status === 200) {
        // Cập nhật task mới với dữ liệu từ server để đảm bảo nhất quán
        const updatedTask = response.data.task;
  
        // Cập nhật danh sách task với task đã được sửa đổi
        const updatedTasks = tasks.map(task =>
          task._id === updatedTask._id ? updatedTask : task
        );
  
        setTasks(updatedTasks);
  
        // Tính toán lại các task chưa hoàn thành
        const currentDate = new Date();
        const newUncompletedTasks = updatedTasks.filter(task =>
          task.status !== 'completed' && new Date(task.dueDate) < currentDate
        );
        setUncompletedTasks(newUncompletedTasks);
  
        // Đóng modal và hiển thị thông báo
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
                      <h3>{task.title}</h3>
                      <p><strong>Mô tả:</strong> {task.description}</p>
                      <p><strong>Hạn chót:</strong> {dueDate.toLocaleString()}</p>
                      <p><strong>Người được giao:</strong> {task.assignedTo && task.assignedTo.fullName ? task.assignedTo.fullName : 'Chưa được gán'}</p>
                      <p><strong>Thưởng:</strong> {task.bonus || 'Không'}</p>
                      <p><strong>Phạt:</strong> {task.penalty || 'Không'}</p>
                      <p><strong>Trạng thái:</strong> {task.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</p>
                      {task.completedAt && (
                        <p><strong>Thời gian hoàn thành:</strong> {new Date(task.completedAt).toLocaleString()}</p>
                      )}
                      <Button onClick={() => {
                        setSelectedTask(task);
                        setNewDeadline({
                          date: dueDate.toISOString().split('T')[0],
                          time: dueDate.toTimeString().split(' ')[0].slice(0, 5)
                        });
                        setShowUpdateDeadlineModal(true);
                      }}>
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
  
        const processData = (response, defaultValue) => response.status === 'fulfilled' ? response.value.data : defaultValue;
  
        const usersData = processData(results[0], { users: [] }).users;
        setUsers(usersData);
  
        const contracts = processData(results[1], []);
        const expiredContracts = contracts.filter(contract => contract.status === 'Hết hiệu lực');
        setExpiredContracts(expiredContracts);
  
        const trialEmployeesList = usersData.filter(user => user.employeeType === 'thử việc');
        setTrialEmployeesList(trialEmployeesList);
  
        const attendanceRecords = processData(results[2], { attendanceRecords: [] }).attendanceRecords;
        const salaries = processData(results[3], { salaries: [] }).salaries;
        const resignations = processData(results[4], { resignations: [] }).resignations;
        const tasksData = processData(results[5], { tasks: [] }).tasks;
        setTasks(tasksData);
  
        // Xử lý dữ liệu xem trước cho công việc đã giao
        const tasksPreviewData = tasksData.slice(0, 3).map(task => ({
          title: task.title,
          assignee: task.assignedTo?.fullName || 'Chưa phân công',
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Chưa có hạn',
          status: task.status
        }));
        setTasksPreview(tasksPreviewData);
  
        // Calculate overdue tasks
        const currentDate = new Date();
        const overdueTasksData = tasksData.filter(task => 
          task.status === 'completed' && new Date(task.completedAt) > new Date(task.dueDate)
        );
        setOverdueTasks(overdueTasksData);
  
        // Calculate uncompleted tasks
        const uncompletedTasksData = tasksData.filter(task =>
          task.status !== 'completed' && new Date(task.dueDate) < currentDate
        );
        setUncompletedTasks(uncompletedTasksData);
  
        // If there are uncompleted tasks, show a notification
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
        const permanentEmployees = usersData.filter(user => user.employeeType === 'chính thức').length;
        const trialEmployees = usersData.filter(user => user.employeeType === 'thử việc').length;
  
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
              onClick={handleTaskCardClick} // Add this onClick handler
              style={{ cursor: 'pointer' }} // Add this to show it's clickable
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
        </>
      )}

{activeSection === 'task' && (
        <TaskGrid>
          <TaskCard as={ExpiredContractCard}>
            <h3>Nhân viên hết hạn hợp đồng</h3>
            {expiredContracts.length > 0 ? (
              expiredContracts.map((contract) => (
                <div key={contract._id}>
                  <p>Tên: {contract.employeeId.fullName}</p>
                  <p>Bắt đầu: {new Date(contract.startDate).toLocaleDateString()}</p>
                  <p>Kết thúc: {new Date(contract.endDate).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p>Không có nhân viên nào.</p>
            )}
          </TaskCard>

          <TaskCard>
            <h3>Nhân viên chưa ký hợp đồng</h3>
            {trialEmployeesList.length > 0 ? (
              trialEmployeesList.map((employee) => (
                <p key={employee._id}>{employee.fullName}</p>
              ))
            ) : (
              <p>Không có nhân viên thử việc nào.</p>
            )}
          </TaskCard>

          <TaskCard onClick={() => setShowAssignedTasksModal(true)}>
            <h3>Công việc đã giao</h3>
            <TaskPreviewList>
              {tasksPreview.map((task, index) => (
                <TaskPreviewItem key={index}>
                  <strong>{task.title}</strong>
                  <span>{task.assignee}</span>
                  <span>Hạn: {task.dueDate}</span>
                  <StatusBadge status={task.status}>{task.status}</StatusBadge>
                </TaskPreviewItem>
              ))}
            </TaskPreviewList>
            <ViewMoreButton>Xem tất cả ({tasks.length} công việc)</ViewMoreButton>
          </TaskCard>

          <TaskCard>
            <h3>Nhân viên trễ hạn công việc</h3>
            {overdueTasks.length > 0 ? (
              overdueTasks.map((task) => (
                <div key={task._id}>
                  <p><strong>Họ tên:</strong> {task.assignedTo && task.assignedTo.fullName ? task.assignedTo.fullName : 'Chưa được gán'}</p>
                  <p><strong>Công việc:</strong> {task.title}</p>
                  <p><strong>Deadline:</strong> {new Date(task.dueDate).toLocaleString()}</p>
                  <p><strong>Thời gian hoàn thành:</strong> {new Date(task.completedAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>Không có nhân viên nào trễ hạn công việc.</p>
            )}
          </TaskCard>

          <TaskCard>
            <h3>Khen thưởng nhân viên</h3>
            {/* Add content for employee rewards here */}
          </TaskCard>

          <TaskCard>
            <h3>Sinh nhật nhân viên</h3>
            {/* Add content for employee birthdays here */}
          </TaskCard>
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
              placeholder="Thưởng"
              value={newTask.bonus}
              onChange={(e) => setNewTask({ ...newTask, bonus: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Phạt"
              value={newTask.penalty}
              onChange={(e) => setNewTask({ ...newTask, penalty: e.target.value })}
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

// Styled components
const TaskGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background-color: #f3f4f6;
`;

const TaskCard = styled.div`
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

// const TaskItem = styled.div`
//   border-bottom: 1px solid #e5e7eb;
//   padding: 10px 0;

//   &:last-child {
//     border-bottom: none;
//   }

//   h4 {
//     margin: 0 0 5px 0;
//     color: #3b82f6;
//   }

//   p {
//     margin: 0 0 5px 0;
//     font-size: 0.9em;
//     color: #4b5563;
//   }
// `;

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

// const ModalContent = styled(motion.div)`
//   background-color: white;
//   padding: 30px;
//   border-radius: 12px;
//   width: 400px;
//   box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);

//   h2 {
//     margin-top: 0;
//     margin-bottom: 25px;
//     color: #2c3e50;
//     font-size: 1.8rem;
//     font-weight: 600;
//     text-align: center;
//     white-space: nowrap;
//   }
// `;

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

const ExpiredContractCard = styled(TaskCard)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #c0c0c0;
    border-radius: 10px;
  }

  p {
    font-size: 0.875rem;
    color: #4b5563;
    margin-bottom: 8px;
  }

  p:nth-child(odd) {
    color: #374151;
    font-weight: bold;
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

const ModalContent = styled(motion.div)`
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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

const ModalHeader = styled.div`
  display: flex;
  justify-content: center; // Centers the title
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

const TaskItem = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    color: #3498db;
  }

  p {
    margin: 5px 0;
    font-size: 0.9rem;
  }

  button {
    margin-top: 10px;
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

const TaskPreviewList = styled.div`
  margin-top: 10px;
`;

const TaskPreviewItem = styled.div`
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;

  strong {
    margin-bottom: 4px;
  }

  span {
    font-size: 0.8rem;
    color: #6c757d;
  }
`;

const StatusBadge = styled.span`
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'completed': return '#28a745';
      case 'in progress': return '#ffc107';
      case 'pending': return '#17a2b8';
      default: return '#6c757d';
    }
  }};
  color: white;
  align-self: flex-start;
`;

const ViewMoreButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 10px;
  padding: 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;
