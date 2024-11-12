import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const MySwal = withReactContent(Swal);

// Styled Components giữ nguyên...

const DetailRow = styled.div`
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  font-weight: 600;
  color: #34495e;
  width: 150px;
  flex-shrink: 0;
`;

const Value = styled.span`
  color: #2c3e50;
  flex: 1;
`;

const AppointmentDetails = styled(motion.div)`
  background-color: #ffffff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 30px;

  h3 {
    color: #2c3e50;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
  }

  .appointment-info {
    margin-bottom: 25px;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ecf0f1;
  }
`;

const PageContainer = styled(motion.div)`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled(motion.h2)`
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 20px;
  text-align: center;
`;

const SubTitle = styled(motion.p)`
  color: #34495e;
  font-size: 18px;
  margin-bottom: 30px;
  text-align: center;
`;

const Table = styled(motion.table)`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`;

const Th = styled.th`
  background-color: #34495e;
  color: #ffffff;
  padding: 15px;
  text-align: left;
  font-weight: 600;
`;

const Td = styled(motion.td)`
  background-color: #ffffff;
  padding: 15px;
  border-top: 1px solid #ecf0f1;
  border-bottom: 1px solid #ecf0f1;
`;

const Button = styled(motion.button)`
  padding: 8px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;

  &.view-btn {
    background-color: #3498db;
    color: white;
    &:hover {
      background-color: #2980b9;
    }
  }

  &.approve-btn {
    background-color: #2ecc71;
    color: white;
    &:hover {
      background-color: #27ae60;
    }
  }

  &.reject-btn {
    background-color: #e74c3c;
    color: white;
    &:hover {
      background-color: #c0392b;
    }
  }

  &.delete-btn {
    background-color: #95a5a6;
    color: white;
    &:hover {
      background-color: #7f8c8d;
    }
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
    &:hover {
      background-color: #bdc3c7;
    }
  }
`;

const FeedbackSection = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const FeedbackInput = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin-top: 8px;
  min-height: 100px;
  resize: vertical;
`;

// Cập nhật StatusBadge để thêm màu cho trạng thái waiting_admin
const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  ${({ status }) => {
    switch (status) {
      case 'pending':
        return 'background-color: #f1c40f; color: #000000;';
      case 'approved':
        return 'background-color: #2ecc71; color: #ffffff;';
      case 'rejected':
        return 'background-color: #e74c3c; color: #ffffff;';
      case 'waiting_admin':
        return 'background-color: #3498db; color: #ffffff;';
      default:
        return 'background-color: #95a5a6; color: #ffffff;';
    }
  }}
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
          {appointments.map((appointment) => {
            const user = appointment.userId;
            if (!user || !user.fullName) {
              return null;
            }

            return (
              <AppointmentRow
                key={appointment._id}
                id={appointment._id}
                name={user.fullName}
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
            );
          })}
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
      // Endpoint for both admin and HR
      const endpoint = role === 'admin' ?
        'http://localhost:5000/api/auth/get-appointments' :
        'http://localhost:5000/api/auth/hr-appointments';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(response.data.appointments);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bổ nhiệm', error);
      setError('Không thể tải danh sách bổ nhiệm. Vui lòng thử lại sau.');
      setLoading(false);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách bổ nhiệm. Vui lòng thử lại sau.',
      });
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