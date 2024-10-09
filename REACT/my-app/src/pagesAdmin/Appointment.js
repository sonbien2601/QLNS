import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin'; 
import '../css/style.css';

// Component hiển thị từng dòng bổ nhiệm
const AppointmentRow = ({ id, name, oldPosition, newPosition, status, reason, createdAt, approvedAt, rejectedAt, handleApprove, handleReject, handleView, handleDelete }) => {
  if (!name) {
    return null;
  }

  return (
    <tr>
      <td>{name}</td>
      <td>{oldPosition}</td>
      <td>{newPosition}</td>
      <td>{status}</td>
      <td>{new Date(createdAt).toLocaleString()}</td> {/* Ngày giờ gửi yêu cầu */}
      <td>{approvedAt ? new Date(approvedAt).toLocaleString() : rejectedAt ? new Date(rejectedAt).toLocaleString() : 'Chưa xử lý'}</td> {/* Ngày giờ phê duyệt hoặc từ chối */}
      <td>
        <button className="view-btn" onClick={() => handleView(id)}>Xem chi tiết</button>
        <button className="approve-btn" onClick={() => handleApprove(id)}>Phê duyệt</button>
        <button className="reject-btn" onClick={() => handleReject(id)}>Từ chối</button>
        <button className="delete-btn" onClick={() => handleDelete(id)}>Xóa yêu cầu</button>
      </td>
    </tr>
  );
}

const AppointmentTable = ({ appointments, handleApprove, handleReject, handleView, handleDelete }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Tên Nhân Viên</th>
          <th>Vị Trí Cũ</th>
          <th>Vị Trí Mới</th>
          <th>Trạng Thái</th>
          <th>Ngày giờ gửi yêu cầu</th>
          <th>Ngày giờ phê duyệt hoặc từ chối</th>
          <th>Hành Động</th>
        </tr>
      </thead>
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
            />
          );
        })}
      </tbody>
    </table>
  );
};

// Component chính: Trang bổ nhiệm
const Appointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/get-appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(response.data.appointments);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách bổ nhiệm', error);
      }
    };
    fetchAppointments();
  }, []);

  const handleView = (appointmentId) => {
    const appointment = appointments.find((app) => app._id === appointmentId);
    setSelectedAppointment(appointment);
  };

  // Phê duyệt bổ nhiệm
  const handleApprove = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/auth/approve-appointment/${appointmentId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Yêu cầu đã được phê duyệt');
      window.location.reload(); // Tải lại trang web
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId ? { ...appointment, status: 'approved' } : appointment
        )
      );
    } catch (error) {
      console.error('Lỗi khi phê duyệt yêu cầu bổ nhiệm', error);
    }
  };

  // Từ chối bổ nhiệm
  const handleReject = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/auth/reject-appointment/${appointmentId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Yêu cầu đã bị từ chối');
      window.location.reload(); // Tải lại trang web
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId ? { ...appointment, status: 'rejected' } : appointment
        )
      );
    } catch (error) {
      console.error('Lỗi khi từ chối yêu cầu bổ nhiệm', error);
    }
  };

  // Xóa yêu cầu bổ nhiệm
  const handleDelete = async (appointmentId) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này không?');
    if (!confirmDelete) return;
  
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/auth/delete-appointment/${appointmentId}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      // Chỉ cập nhật state sau khi xóa thành công
      if (response.status === 200) {
        setAppointments(prevAppointments => 
          prevAppointments.filter(appointment => appointment._id !== appointmentId)
        );
        alert('Xóa yêu cầu bổ nhiệm thành công');
        window.location.reload(); // Tải lại trang web
      }
    } catch (error) {
      console.error('Lỗi khi xóa bổ nhiệm:', error);
      alert('Lỗi khi xóa yêu cầu bổ nhiệm: ' + 
        (error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại'));
    }
  };


  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Quản lý Bổ nhiệm</h2>
        <p>Dưới đây là danh sách các nhân viên được bổ nhiệm:</p>
        <AppointmentTable
          appointments={appointments}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleView={handleView}
          handleDelete={handleDelete}
        />
        {selectedAppointment && (
          <div className="appointment-details">
            <h3>Chi tiết bổ nhiệm</h3>
            <p><strong>Tên nhân viên:</strong> {selectedAppointment.userId.fullName}</p>
            <p><strong>Vị trí cũ:</strong> {selectedAppointment.oldPosition}</p>
            <p><strong>Vị trí mới:</strong> {selectedAppointment.newPosition}</p>
            <p><strong>Lý do:</strong> {selectedAppointment.reason}</p>
            <p><strong>Trạng thái:</strong> {selectedAppointment.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointment;
