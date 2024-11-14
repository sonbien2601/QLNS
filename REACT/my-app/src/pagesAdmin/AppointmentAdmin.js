import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const MySwal = withReactContent(Swal);

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
  margin-top: 1rem;
`;

// Cập nhật Th
const Th = styled.th`
  background-color: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Cập nhật Td
const Td = styled(motion.td)`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.875rem;

  &:first-child {
    font-weight: 600;
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
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  ${({ status }) => {
    switch (status) {
      case 'pending':
        return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        `;
      case 'waiting_admin':
        return `
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
      case 'approved':
        return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        `;
      case 'rejected':
        return `
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
      default:
        return `
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        `;
    }
  }}
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


// Component hiển thị từng dòng bổ nhiệm với kiểm tra role
const AppointmentRow = ({
  id,
  appointment, // Thêm prop appointment để lấy toàn bộ thông tin
  oldPosition,
  newPosition,
  status,
  reason,
  hrFeedback,
  createdAt,
  approvedAt,
  rejectedAt,
  hrFeedbackAt,
  handleApprove,
  handleReject,
  handleView,
  handleDelete,
  userRole
}) => {
  // Log data để debug
  console.log('AppointmentRow Data:', {
    id,
    appointment,
    status,
    userRole
  });

  // Lấy tên nhân viên từ nhiều nguồn dữ liệu có thể có
  const getEmployeeName = () => {
    if (appointment?.userId?.fullName) return appointment.userId.fullName;
    if (appointment?.requestData?.userId?.fullName) return appointment.requestData.userId.fullName;
    if (appointment?.requestData?.employeeName) return appointment.requestData.employeeName;
    return 'N/A';
  };

  const name = getEmployeeName();
  if (!name || name === 'N/A') return null;

  const canApprove = userRole === 'admin' || (userRole === 'hr' && status === 'pending');
  const canDelete = userRole === 'admin';

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'waiting_admin': return 'Chờ Admin duyệt';
      default: return status;
    }
  };

  // Format date với options cụ thể
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Td>
        <span style={{ fontWeight: '500' }}>{name}</span>
      </Td>
      <Td>{oldPosition || 'N/A'}</Td>
      <Td>{newPosition || 'N/A'}</Td>
      <Td>
        <StatusBadge status={status}>
          {getStatusText(status)}
        </StatusBadge>
      </Td>
      <Td>{formatDate(createdAt)}</Td>
      <Td>
        {approvedAt ? (
          <span style={{ color: '#16a34a' }}>
            Đã duyệt: {formatDate(approvedAt)}
          </span>
        ) : rejectedAt ? (
          <span style={{ color: '#dc2626' }}>
            Đã từ chối: {formatDate(rejectedAt)}
          </span>
        ) : hrFeedbackAt ? (
          <span style={{ color: '#2563eb' }}>
            HR phản hồi: {formatDate(hrFeedbackAt)}
          </span>
        ) : (
          <span style={{ color: '#6b7280' }}>Chưa xử lý</span>
        )}
      </Td>
      <Td style={{ display: 'flex', gap: '8px' }}>
        <Button
          className="view-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleView(id)}
          style={{
            backgroundColor: '#3b82f6',
            minWidth: 'auto',
            padding: '8px 12px'
          }}
        >
          Xem chi tiết
        </Button>
        {canApprove && status === 'pending' && (
          <>
            <Button
              className="approve-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleApprove(id)}
              style={{
                backgroundColor: '#22c55e',
                minWidth: 'auto',
                padding: '8px 12px'
              }}
            >
              {userRole === 'hr' ? 'Đề xuất duyệt' : 'Phê duyệt'}
            </Button>
            <Button
              className="reject-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReject(id)}
              style={{
                backgroundColor: '#ef4444',
                minWidth: 'auto',
                padding: '8px 12px'
              }}
            >
              Từ chối
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            className="delete-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDelete(id)}
            style={{
              backgroundColor: '#6b7280',
              minWidth: 'auto',
              padding: '8px 12px'
            }}
          >
            Xóa yêu cầu
          </Button>
        )}
      </Td>
    </motion.tr>
  );
};


// Component AppointmentTable
const AppointmentTable = ({ appointments, handleApprove, handleReject, handleView, handleDelete, userRole }) => {
  // Log để debug
  console.log('AppointmentTable props:', {
    appointments,
    userRole
  });

  return (
    <Table
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <thead>
        <tr>
          <Th>Tên Nhân Viên</Th>
          <Th>Vị Trí Cũ</Th>
          <Th>Vị Trí Mới</Th>
          <Th>Trạng Thái</Th>
          <Th>Ngày giờ gửi yêu cầu</Th>
          <Th>Ngày giờ phê duyệt hoặc từ chối</Th>
          <Th>Hành Động</Th>
        </tr>
      </thead>
      <AnimatePresence>
        <tbody>
          {Array.isArray(appointments) && appointments.length > 0 ? (
            appointments.map((appointment) => (
              <AppointmentRow
                key={appointment._id}
                appointment={appointment} // Pass toàn bộ appointment object
                id={appointment._id}
                oldPosition={appointment.oldPosition}
                newPosition={appointment.newPosition}
                status={appointment.status}
                reason={appointment.reason}
                createdAt={appointment.createdAt}
                approvedAt={appointment.approvedAt}
                rejectedAt={appointment.rejectedAt}
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

// Component chính với phân quyền
// Component chính với phân quyền
const Appointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setUserRole(role);
    fetchAppointments(role);
  }, []);

  const fetchAppointments = async (role) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = role === 'admin' ?
        'http://localhost:5000/api/auth/get-appointments' :
        'http://localhost:5000/api/auth/hr-appointments';

      console.log("Fetching appointments from:", endpoint); // Log endpoint

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response data:", response.data); // Log response

      if (response.data?.appointments) {
        setAppointments(response.data.appointments);
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
  const handleReject = async (appointmentId) => {
    if (userRole === 'hr') {
      await handleHRReject(appointmentId);
      return;
    }

    // Logic từ chối của admin
    if (userRole !== 'admin') return;

    const result = await MySwal.fire({
      title: 'Xác nhận từ chối',
      text: "Bạn có chắc chắn muốn từ chối yêu cầu này không?",
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
        await axios.put(
          `http://localhost:5000/api/auth/reject-appointment/${appointmentId}`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        MySwal.fire('Đã từ chối!', 'Yêu cầu bổ nhiệm đã bị từ chối.', 'success');
        fetchAppointments(userRole);
      } catch (error) {
        MySwal.fire('Lỗi!', 'Có lỗi xảy ra khi từ chối yêu cầu. Vui lòng thử lại.', 'error');
      }
    }
  };

  const handleDelete = async (appointmentId) => {
    if (userRole !== 'admin') return;

    const result = await MySwal.fire({
      title: 'Xác nhận xóa',
      text: "Bạn có chắc chắn muốn xóa yêu cầu này không? Hành động này không thể hoàn tác!",
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
        await axios.delete(
          `http://localhost:5000/api/auth/delete-appointment/${appointmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        MySwal.fire('Đã xóa!', 'Yêu cầu bổ nhiệm đã được xóa thành công.', 'success');
        fetchAppointments(userRole);
      } catch (error) {
        MySwal.fire('Lỗi!', 'Có lỗi xảy ra khi xóa yêu cầu. Vui lòng thử lại.', 'error');
      }
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
        <SubTitle
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {userRole === 'admin' ?
            'Dưới đây là danh sách các yêu cầu bổ nhiệm cần xử lý:' :
            'Dưới đây là danh sách các yêu cầu bổ nhiệm:'}
        </SubTitle>

        {loading ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Đang tải dữ liệu...
          </motion.p>
        ) : error ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.p>
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

        <AnimatePresence>
          {selectedAppointment && renderDetails()}
        </AnimatePresence>
      </ContentContainer>
    </PageContainer>
  );
};

export default Appointment;