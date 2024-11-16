import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

const MySwal = withReactContent(Swal);


const styles = {
  tableRow: {
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  tableCell: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    color: '#475569'
  }
};

// Cập nhật PageContainer
const PageContainer = styled(motion.div)`
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 2rem;
`;

// Cập nhật ContentContainer 
const ContentContainer = styled(motion.div)`
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
`;

// Cập nhật Title 
const Title = styled(motion.h2)`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
  letter-spacing: -0.025em;
`;

// Cập nhật SubTitle
const SubTitle = styled(motion.p)`
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

// Cập nhật Table
const Table = styled(motion.table)`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  thead {
    background-color: #f8fafc;
  }
  
  tbody tr {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f8fafc;
    }

    &:last-child td {
      border-bottom: none;
    }
  }
`;


// Cập nhật Th
const Th = styled.th`
  color: #1e293b;
  font-weight: 600;
  padding: 16px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`;

// Cập nhật Td
const Td = styled(motion.td)`
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.875rem;
  vertical-align: middle;

  &:first-child {
    font-weight: 500;
    color: #1e293b;
  }
`;


// Cập nhật Button
const Button = styled(motion.button)`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &.view-btn {
    background-color: #2563eb;
    color: white;
    &:hover {
      background-color: #1d4ed8;
    }
  }

  &.approve-btn {
    background-color: #22c55e;
    color: white;
    &:hover {
      background-color: #16a34a;
    }
  }

  &.reject-btn {
    background-color: #ef4444;
    color: white;
    &:hover {
      background-color: #dc2626;
    }
  }

  &.delete-btn {
    background-color: #64748b;
    color: white;
    &:hover {
      background-color: #475569;
    }
  }

  &:disabled {
    background-color: #e2e8f0;
    cursor: not-allowed;
    &:hover {
      background-color: #e2e8f0;
    }
  }
`;

// Cập nhật StatusBadge
const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 80px;
  
  ${({ status }) => {
    switch (status) {
      case 'pending':
        return `
          background-color: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
        `;
      case 'waiting_admin':
        return `
          background-color: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        `;
      case 'approved':
        return `
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'rejected':
        return `
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        `;
      default:
        return `
          background-color: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        `;
    }
  }}
`;


const ActionButton = styled(Button)`
  padding: 8px 16px;
  font-size: 0.875rem;
  border-radius: 6px;
  min-width: 100px;
  transition: all 0.2s ease;
  opacity: 0.9;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
  }

  &.approve-btn {
    background-color: #22c55e;
    margin-right: 8px;
  }

  &.reject-btn {
    background-color: #ef4444;
    margin-right: 8px;
  }

  &.delete-btn {
    background-color: #64748b;
  }
`;

// Container cho nhóm nút hành động
const ActionButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;


// Cập nhật AppointmentDetails
const AppointmentDetails = styled(motion.div)`
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-top: 2rem;
  overflow: hidden;

  h3 {
    color: #1e293b;
    font-size: 1.25rem;
    font-weight: 600;
    padding: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    margin: 0;
  }

  .appointment-info {
    padding: 1.25rem;
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1.25rem;
    border-top: 1px solid #e2e8f0;
    background-color: #f8fafc;
  }
`;

// Cập nhật DetailRow
const DetailRow = styled.div`
  display: flex;
  padding: 0.75rem 0;
  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

// Cập nhật Label
const Label = styled.span`
  color: #64748b;
  font-weight: 500;
  width: 180px;
  flex-shrink: 0;
  font-size: 0.875rem;
`;

// Cập nhật Value
const Value = styled.span`
  color: #1e293b;
  flex: 1;
  font-size: 0.875rem;
`;

const FormContainer = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  select, input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #1a237e;
      box-shadow: 0 0 0 2px rgba(26,35,126,0.2);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const SubmitButton = styled(Button)`
  background: #1a237e;
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
  
  &:hover {
    background: #0d1b60;
  }
`;
const getStatusText = (status) => {
  const safeStatus = status || 'pending'; // Đảm bảo luôn có giá trị mặc định

  switch (safeStatus) {
    case 'pending':
      return 'Chờ duyệt';
    case 'approved':
      return 'Đã phê duyệt';
    case 'rejected':
      return 'Đã từ chối';
    default:
      return 'Chờ duyệt'; // Thay "Không xác định" thành "Chờ duyệt"
  }
};

// Component hiển thị từng dòng bổ nhiệm với kiểm tra role
const AppointmentRow = ({
  id,
  appointment,
  oldPosition,
  newPosition,
  status,
  reason,
  hrFeedback,
  createdAt,
  handleApprove,
  handleReject,
  handleDelete,
  userRole
}) => {
  const renderActionButtons = () => {
    if (userRole === 'admin' && (status === 'pending' || status === 'waiting_admin')) {
      return (
        <ActionButtonGroup>
          <ActionButton
            className="approve-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleApprove(id)}
          >
            Phê duyệt
          </ActionButton>
          <ActionButton
            className="reject-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleReject(id)}
          >
            Từ chối
          </ActionButton>
          <ActionButton
            className="delete-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDelete(id)}
          >
            Xóa yêu cầu
          </ActionButton>
        </ActionButtonGroup>
      );
    }
    return null;
  };

  return (
    <tr>
      <Td>{oldPosition}</Td>
      <Td>{newPosition}</Td>
      <Td>{reason}</Td>
      <Td>
        <StatusBadge status={status || 'pending'}>
          {getStatusText(status)}
        </StatusBadge>
      </Td>
      <Td>{new Date(createdAt).toLocaleString()}</Td>
      <Td>{hrFeedback || 'Chưa có phản hồi'}</Td>
      <Td>{renderActionButtons()}</Td>
    </tr>
  );
};

// Component AppointmentTable
const AppointmentTable = ({ appointments, handleApprove, handleReject, handleView, handleDelete, userRole }) => {
  return (
    <Table
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <thead>
        <tr>
          <Th>Vị Trí Cũ</Th>
          <Th>Vị Trí Mới</Th>
          <Th>Lý Do</Th>
          <Th>Trạng Thái</Th>
          <Th>Ngày Tạo</Th>
          <Th>Phản Hồi HR</Th>
          <Th>Hành Động</Th>
        </tr>
      </thead>
      <AnimatePresence>
        <tbody>
          {Array.isArray(appointments) && appointments.length > 0 ? (
            appointments.map((appointment) => (
              <AppointmentRow
                key={appointment._id}
                id={appointment._id}
                appointment={appointment}
                oldPosition={appointment.oldPosition}
                newPosition={appointment.newPosition}
                status={appointment.status}
                reason={appointment.reason}
                hrFeedback={appointment.hrFeedback}
                createdAt={appointment.createdAt}
                approvedAt={appointment.approvedAt}
                rejectedAt={appointment.rejectedAt}
                hrFeedbackAt={appointment.hrFeedbackAt}
                handleApprove={handleApprove}
                handleReject={handleReject}
                handleView={handleView}
                handleDelete={handleDelete}
                userRole={userRole}
              />
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                Không có yêu cầu bổ nhiệm nào
              </td>
            </tr>
          )}
        </tbody>
      </AnimatePresence>
    </Table>
  );
};

const AppointmentForm = ({ users, onSubmit, userRole }) => {
  const [formData, setFormData] = useState({
    userId: '',
    newPosition: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectedUser = users.find(user => user._id === formData.userId);
  const isValidForm = formData.userId && formData.newPosition && formData.reason && 
                     formData.effectiveDate && (!selectedUser || selectedUser.position !== formData.newPosition);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidForm) return;

    // Call parent submit handler
    onSubmit(formData);
  };

  return (
    <FormContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 style={{ marginBottom: '1.5rem', color: '#1a237e' }}>
        {userRole === 'admin' ? 'Chỉ định bổ nhiệm mới' : 'Tạo yêu cầu bổ nhiệm mới'}
      </h3>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <label>Chọn nhân viên:</label>
          <select
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn nhân viên --</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.fullName} - {user.position}
              </option>
            ))}
          </select>
        </FormGroup>

        <FormGroup>
          <label>Vị trí/Chức vụ mới:</label>
          <input
            type="text"
            name="newPosition"
            value={formData.newPosition}
            onChange={handleChange}
            required
            placeholder="Nhập vị trí/chức vụ mới"
          />
          {selectedUser && selectedUser.position === formData.newPosition && (
            <small style={{ color: 'red' }}>Vị trí mới phải khác vị trí hiện tại</small>
          )}
        </FormGroup>

        <FormGroup style={{ gridColumn: '1 / -1' }}>
          <label>Lý do đề xuất:</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="Nhập lý do đề xuất bổ nhiệm"
          />
        </FormGroup>

        <FormGroup>
          <label>Ngày hiệu lực:</label>
          <input
            type="date"
            name="effectiveDate" 
            value={formData.effectiveDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </FormGroup>

        <SubmitButton
          type="submit"
          style={{ gridColumn: '1 / -1' }}
          disabled={!isValidForm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FileText size={20} />
          {userRole === 'hr' ? 'Gửi yêu cầu bổ nhiệm' : 'Thực hiện bổ nhiệm'}
        </SubmitButton>
      </Form>
    </FormContainer>
  );
};


// Component chính với phân quyền
// Component chính với phân quyền
const Appointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setUserRole(role);
    fetchAppointments(role);
    fetchUsers();
  }, []);

  // Add fetchUsers function
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách nhân viên'
      });
    }
  };

   // Add handleAppointmentSubmit function
   const handleAppointmentSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const selectedUser = users.find(user => user._id === formData.userId);

      const result = await MySwal.fire({
        title: 'Xác nhận bổ nhiệm',
        html: `
          <div style="text-align: left">
            <p><strong>Nhân viên:</strong> ${selectedUser?.fullName}</p>
            <p><strong>Vị trí hiện tại:</strong> ${selectedUser?.position}</p>
            <p><strong>Vị trí mới:</strong> ${formData.newPosition}</p>
            <p><strong>Lý do:</strong> ${formData.reason}</p>
            <p><strong>Ngày hiệu lực:</strong> ${new Date(formData.effectiveDate).toLocaleDateString('vi-VN')}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          'http://localhost:5000/api/auth/appointment-request',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        await MySwal.fire({
          icon: 'success',
          title: 'Thành công',
          text: userRole === 'hr' ? 
            'Yêu cầu bổ nhiệm đã được gửi đến Admin để phê duyệt' : 
            'Đã tạo yêu cầu bổ nhiệm thành công',
          timer: 1500
        });

        fetchAppointments(userRole);
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || 'Không thể tạo yêu cầu bổ nhiệm'
      });
    }
  };

  const fetchAppointments = async (role) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let endpoint;
      
      // Phân biệt endpoint dựa trên role
      if (role === 'admin') {
        endpoint = 'http://localhost:5000/api/auth/get-appointments'; // Endpoint cho admin
      } else if (role === 'hr') {
        endpoint = 'http://localhost:5000/api/auth/hr-appointments'; // Endpoint cho HR
      } else {
        endpoint = 'http://localhost:5000/api/auth/user-appointments'; // Endpoint cho user
      }
  
      console.log("Fetching appointments from:", endpoint); 
  
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      console.log("Response data:", response.data);
  
      if (response.data?.appointments) {
        // Format lại data để hiển thị đúng trạng thái
        const formattedAppointments = response.data.appointments.map(app => ({
          ...app,
          status: role === 'admin' && app.status === 'pending' ? 'pending' : app.status
        }));
        setAppointments(formattedAppointments);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Không thể tải danh sách bổ nhiệm');
      setLoading(false);
    }
  };

  const handleView = async (appointmentId) => {
    const appointment = appointments.find((app) => app._id === appointmentId);
    setSelectedAppointment(appointment);
  };

  const handleHRApproval = async (appointmentId) => {
    if (userRole !== 'hr') return;

    try {
      const result = await MySwal.fire({
        title: 'Xác nhận đề xuất',
        html: `
            <div>
              <p>Yêu cầu sẽ được gửi đến Admin để phê duyệt cuối cùng</p>
              <textarea 
                id="feedback" 
                class="swal2-textarea" 
                placeholder="Nhập ý kiến đề xuất của bạn (nếu có)"
              ></textarea>
            </div>
          `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Gửi đề xuất',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          const feedback = document.getElementById('feedback').value;
          if (!feedback) {
            Swal.showValidationMessage('Vui lòng nhập ý kiến đề xuất');
          }
          return feedback;
        }
      });

      if (result.isConfirmed) {
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Không tìm thấy token xác thực');
        }

        // Log request data
        console.log('Sending request:', {
          appointmentId,
          feedback: result.value,
          token: token.substring(0, 10) + '...' // Log một phần token để bảo mật
        });

        const response = await axios({
          method: 'PUT',
          url: `http://localhost:5000/api/auth/hr-appointments/${appointmentId}/process`,
          data: {
            action: 'approve',
            feedback: result.value
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Log response data
        console.log('Server response:', response.data);

        if (response.data) {
          await MySwal.fire({
            icon: 'success',
            title: 'Thành công',
            text: response.data.message || 'Đề xuất đã được gửi đến Admin',
            timer: 1500
          });

          await fetchAppointments(userRole);
        }
      }
    } catch (error) {
      console.error('API Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      let errorMessage = 'Có lỗi xảy ra khi gửi yêu cầu';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server, vui lòng thử lại sau';
      }

      await MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHRReject = async (appointmentId) => {
    if (userRole !== 'hr') return;

    try {
      const result = await MySwal.fire({
        title: 'Xác nhận từ chối',
        html: `
            <div>
              <p>Vui lòng nhập lý do từ chối</p>
              <textarea id="feedback" 
                        class="swal2-textarea" 
                        placeholder="Nhập lý do từ chối"
                        required></textarea>
            </div>
          `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Từ chối',
        cancelButtonText: 'Hủy bỏ',
        preConfirm: () => {
          const feedback = document.getElementById('feedback').value;
          if (!feedback) {
            Swal.showValidationMessage('Vui lòng nhập lý do từ chối');
          }
          return feedback;
        }
      });

      if (result.isConfirmed) {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Log request data
        console.log('Sending rejection request:', {
          appointmentId,
          feedback: result.value
        });

        const response = await axios({
          method: 'PUT',
          // Sửa lại URL endpoint giống như approve
          url: `http://localhost:5000/api/auth/hr-appointments/${appointmentId}/process`,
          data: {
            action: 'reject',
            feedback: result.value
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Server response:', response.data);

        await MySwal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đề xuất từ chối đã được gửi đến Admin',
          timer: 1500
        });

        await fetchAppointments(userRole);
      }
    } catch (error) {
      console.error('Error in HR rejection:', error);

      let errorMessage = 'Có lỗi xảy ra khi gửi yêu cầu từ chối';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      await MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId) => {
    if (userRole === 'hr') {
      await handleHRApproval(appointmentId);
      return;
    }

    // Giữ nguyên logic phê duyệt của admin
    if (userRole !== 'admin') return;

    const result = await MySwal.fire({
      title: 'Xác nhận phê duyệt',
      text: "Bạn có chắc chắn muốn phê duyệt yêu cầu này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const appointment = appointments.find(app => app._id === appointmentId);
        const isRejectApproval = appointment.hrAction === 'reject';

        const response = await axios.put(
          `http://localhost:5000/api/auth/approve-appointment/${appointmentId}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        MySwal.fire(
          'Đã phê duyệt!',
          isRejectApproval ?
            'Đã phê duyệt việc từ chối bổ nhiệm.' :
            'Yêu cầu bổ nhiệm đã được phê duyệt thành công.',
          'success'
        );

        fetchAppointments(userRole);
      } catch (error) {
        MySwal.fire(
          'Lỗi!',
          'Có lỗi xảy ra khi phê duyệt yêu cầu. Vui lòng thử lại.',
          'error'
        );
      }
    }
  };

  // Thêm các hàm xử lý còn thiếu trong component Appointment 
// 1. Sửa lại endpoint cho việc từ chối yêu cầu bổ nhiệm
const handleReject = async (appointmentId) => {
  if (userRole === 'hr') {
    await handleHRReject(appointmentId);
    return;
  }

  if (userRole !== 'admin') return;

  try {
    const result = await MySwal.fire({
      title: 'Xác nhận từ chối',
      html: `
        <div>
          <p>Vui lòng nhập lý do từ chối</p>
          <textarea 
            id="feedback" 
            class="swal2-textarea"
            placeholder="Nhập lý do từ chối"
            style="min-height: 100px;"
          ></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy bỏ',
      preConfirm: () => {
        const feedback = document.getElementById('feedback').value;
        if (!feedback) {
          Swal.showValidationMessage('Vui lòng nhập lý do từ chối');
        }
        return feedback;
      }
    });

    if (result.isConfirmed) {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Sửa endpoint thành appointments thay vì appointment
      await axios({
        method: 'PUT',
        url: `http://localhost:5000/api/auth/appointments/${appointmentId}/reject`,
        data: {
          adminResponse: result.value
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await MySwal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Yêu cầu bổ nhiệm đã bị từ chối',
        timer: 1500
      });

      await fetchAppointments(userRole);
    }
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    
    let errorMessage = 'Có lỗi xảy ra khi từ chối yêu cầu';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    await MySwal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: errorMessage
    });
  } finally {
    setLoading(false);
  }
};

// 2. Sửa lại endpoint cho việc xóa yêu cầu bổ nhiệm
const handleDelete = async (appointmentId) => {
  if (userRole !== 'admin') return;

  try {
    const result = await MySwal.fire({
      title: 'Xác nhận xóa',
      text: "Bạn có chắc chắn muốn xóa yêu cầu này không? Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy bỏ',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Sửa endpoint thành appointments thay vì appointment
      await axios({
        method: 'DELETE',
        url: `http://localhost:5000/api/auth/appointments/${appointmentId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await MySwal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Yêu cầu bổ nhiệm đã được xóa thành công',
        timer: 1500
      });

      await fetchAppointments(userRole);
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    
    let errorMessage = 'Có lỗi xảy ra khi xóa yêu cầu';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    await MySwal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: errorMessage
    });
  } finally {
    setLoading(false);
  }
};

  const renderDetails = () => (
    <AppointmentDetails
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h3>Chi tiết bổ nhiệm</motion.h3>
      <motion.div className="appointment-info">
        <DetailRow>
          <Label>Tên nhân viên:</Label>
          <Value>{selectedAppointment.userId.fullName}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Vị trí hiện tại:</Label>
          <Value>{selectedAppointment.oldPosition}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Vị trí đề xuất:</Label>
          <Value>{selectedAppointment.newPosition}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Lý do:</Label>
          <Value>{selectedAppointment.reason}</Value>
        </DetailRow>
        <DetailRow>
          <Label>Trạng thái:</Label>
          <Value>
            <StatusBadge status={selectedAppointment.status}>
              {selectedAppointment.status === 'pending' ? 'Chờ duyệt' :
                selectedAppointment.status === 'approved' ? 'Đã duyệt' :
                  selectedAppointment.status === 'rejected' ? 'Từ chối' :
                    selectedAppointment.status}
            </StatusBadge>
          </Value>
        </DetailRow>
        <DetailRow>
          <Label>Ngày yêu cầu:</Label>
          <Value>{new Date(selectedAppointment.createdAt).toLocaleString()}</Value>
        </DetailRow>
        {selectedAppointment.approvedAt && (
          <DetailRow>
            <Label>Ngày phê duyệt:</Label>
            <Value>{new Date(selectedAppointment.approvedAt).toLocaleString()}</Value>
          </DetailRow>
        )}
        {selectedAppointment.rejectedAt && (
          <DetailRow>
            <Label>Ngày từ chối:</Label>
            <Value>{new Date(selectedAppointment.rejectedAt).toLocaleString()}</Value>
          </DetailRow>
        )}
      </motion.div>
      <motion.div
        className="action-buttons"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {userRole === 'admin' && selectedAppointment.status === 'pending' && (
          <>
            <Button
              className="approve-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleApprove(selectedAppointment._id)}
            >
              Phê duyệt
            </Button>
            <Button
              className="reject-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReject(selectedAppointment._id)}
            >
              Từ chối
            </Button>
          </>
        )}
        <Button
          className="view-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedAppointment(null)}
        >
          Đóng
        </Button>
      </motion.div>
    </AppointmentDetails>
  );

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ContentContainer>
        <Title
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {userRole === 'admin' ? 'Quản lý Bổ nhiệm' : 'Danh sách Bổ nhiệm'}
        </Title>

        {/* Add AppointmentForm */}
        <AppointmentForm 
          users={users}
          onSubmit={handleAppointmentSubmit}
          userRole={userRole}
        />

        <SubTitle
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {userRole === 'admin' ?
            'Danh sách các yêu cầu bổ nhiệm cần xử lý:' :
            'Danh sách các yêu cầu bổ nhiệm:'}
        </SubTitle>

        {loading ? (
          <motion.div 
            className="loading-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              style={{
                color: '#6b7280',
                fontSize: '1.1rem'
              }}
            >
              Đang tải dữ liệu...
            </motion.p>
          </motion.div>
        ) : error ? (
          <motion.div
            className="error-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              style={{
                color: '#ef4444',
                fontSize: '1.1rem'
              }}
            >
              {error}
            </motion.p>
          </motion.div>
        ) : (
          <>
            {appointments.length === 0 ? (
              <motion.div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p>Chưa có yêu cầu bổ nhiệm nào</p>
              </motion.div>
            ) : (
              <AppointmentTable
                appointments={appointments}
                handleApprove={handleApprove}
                handleReject={handleReject}
                handleView={handleView}
                handleDelete={handleDelete}
                userRole={userRole}
              />
            )}
          </>
        )}

        {/* Stats Summary Section */}
        {!loading && !error && appointments.length > 0 && (
          <motion.div
            className="stats-summary"
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h3 style={{ 
              marginBottom: '1rem',
              color: '#1e293b',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              Tổng quan yêu cầu bổ nhiệm
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ color: '#6b7280' }}>Tổng số yêu cầu:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                  {appointments.length}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Đang chờ duyệt:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#eab308' }}>
                  {appointments.filter(app => app.status === 'pending').length}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Đã phê duyệt:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#22c55e' }}>
                  {appointments.filter(app => app.status === 'approved').length}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Đã từ chối:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
                  {appointments.filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {selectedAppointment && renderDetails()}
        </AnimatePresence>
      </ContentContainer>
    </PageContainer>
  );
};

export default Appointment;