import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

const AppointmentStatus = () => {
  const [appointments, setAppointments] = useState([]);
  const [oldPosition, setOldPosition] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [reason, setReason] = useState('');

  // Lấy danh sách bổ nhiệm của user
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/user-appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(response.data.appointments);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách bổ nhiệm', error);
      }
    };
    fetchAppointments();
  }, []);

  // Hủy yêu cầu bổ nhiệm
  const handleCancel = async (appointmentId) => {
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này không?');
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/auth/cancel-appointment/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Yêu cầu bổ nhiệm đã được hủy');
      setAppointments(appointments.filter((appointment) => appointment._id !== appointmentId));
    } catch (error) {
      alert('Lỗi khi hủy yêu cầu bổ nhiệm');
    }
  };

  // Gửi yêu cầu bổ nhiệm
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/auth/appointment-request',
        { oldPosition, newPosition, reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Yêu cầu bổ nhiệm đã được gửi');
      // Clear form
      setOldPosition('');
      setNewPosition('');
      setReason('');
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu bổ nhiệm');
    }
  };

  return (
    <div className="main-container">
      <NavigationUser />
      <div className="content">
        <h2>Trạng thái bổ nhiệm của bạn</h2>

        {/* Form gửi yêu cầu bổ nhiệm */}
        <form className="appointment-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vị Trí Cũ:</label>
            <input
              type="text"
              value={oldPosition}
              onChange={(e) => setOldPosition(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Vị Trí Mới:</label>
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Lý Do:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="submit-btn">Gửi yêu cầu bổ nhiệm</button>
        </form>

        <table className="applicant-table">
          <thead>
            <tr>
              <th>Vị Trí Cũ</th>
              <th>Vị Trí Mới</th>
              <th>Lý Do</th>
              <th>Trạng Thái</th>
              <th>Ngày giờ gửi yêu cầu</th> {/* Ngày giờ gửi yêu cầu */}
              <th>Ngày giờ phê duyệt</th> {/* Ngày giờ phê duyệt */}
              <th>Ngày giờ từ chối</th> {/* Ngày giờ từ chối */}
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment._id}>
                <td>{appointment.oldPosition}</td>
                <td>{appointment.newPosition}</td>
                <td>{appointment.reason}</td>
                <td>{appointment.status === 'pending' ? 'Đang chờ duyệt' : appointment.status === 'approved' ? 'Đã phê duyệt' : 'Bị từ chối'}</td>
                <td>{new Date(appointment.createdAt).toLocaleString()}</td> {/* Ngày giờ gửi yêu cầu */}
                <td>{appointment.approvedAt ? new Date(appointment.approvedAt).toLocaleString() : 'Chưa phê duyệt'}</td> {/* Ngày giờ phê duyệt */}
                <td>{appointment.rejectedAt ? new Date(appointment.rejectedAt).toLocaleString() : 'Chưa từ chối'}</td> {/* Ngày giờ từ chối */}
                <td>
                  {appointment.status === 'pending' && (
                    <button className="cancel-btn" onClick={() => handleCancel(appointment._id)}>
                      Hủy yêu cầu
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default AppointmentStatus;
