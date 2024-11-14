import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationUser from '../components/NavigationUser';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';

const MySwal = withReactContent(Swal);


const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  ${({ status }) => {
    switch (status) {
      case 'pending':
        return `
          background-color: #fff7ed;
          color: #c2410c;
          border: 1px solid #fdba74;
        `;
      case 'waiting_admin':
        return `
          background-color: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        `;
      case 'approved':
        return `
          background-color: #f0fdf4;
          color: #15803d;
          border: 1px solid #86efac;
        `;
      case 'rejected':
        return `
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        `;
      default:
        return `
          background-color: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        `;
    }
  }}
`;

const AppointmentStatus = () => {
  const [appointments, setAppointments] = useState([]);
  const [currentPosition, setCurrentPosition] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchAppointments();
    fetchUserInfo();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Call API lấy danh sách bổ nhiệm của user hiện tại
      const response = await axios.get(
        `http://localhost:5000/api/auth/user-appointments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.appointments) {
        // Map data trả về để hiển thị status text dễ hiểu hơn
        const formattedAppointments = response.data.appointments.map(app => ({
          ...app,
          displayStatus: getStatusText(app.status)
        }));

        setAppointments(formattedAppointments);
      }

    } catch (error) {
      console.error('Lỗi khi lấy danh sách bổ nhiệm:', error);
      setError(error.response?.data?.message || 'Không thể tải danh sách bổ nhiệm');

      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách bổ nhiệm. Vui lòng thử lại sau.',
      });

    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ HR duyệt';
      case 'waiting_admin':
        return 'Chờ Admin duyệt';
      case 'approved':
        return 'Đã phê duyệt';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://localhost:5000/api/auth/user-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data);
      setCurrentPosition(response.data.position || 'Không có thông tin');
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng', error);
      setCurrentPosition('Không thể lấy thông tin');
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      const result = await MySwal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn sẽ không thể hoàn tác hành động này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Có, hủy yêu cầu!',
        cancelButtonText: 'Không'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://localhost:5000/api/auth/cancel-appointment/${appointmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await MySwal.fire({
          icon: 'success',
          title: 'Đã hủy!',
          text: 'Yêu cầu bổ nhiệm đã được hủy thành công.',
          timer: 1500,
          showConfirmButton: false,
        });

        fetchAppointments(); // Tải lại danh sách
      }
    } catch (error) {
      console.error('Lỗi khi hủy yêu cầu:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || 'Không thể hủy yêu cầu bổ nhiệm. Vui lòng thử lại.',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/auth/appointment-request',
        {
          newPosition,
          reason,
          userId: localStorage.getItem('userId'), // Thêm userId để tracking
          requestedBy: localStorage.getItem('userId') // Thêm requestedBy để biết ai gửi
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.appointment) {
        await MySwal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Yêu cầu bổ nhiệm đã được gửi và đang chờ xử lý trên trang quản lý của HR/Admin.',
          timer: 2500,
          showConfirmButton: false,
        });

        setNewPosition('');
        setReason('');
        fetchAppointments(); // Tải lại danh sách của user
      }
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu:', error);
      let errorMessage = 'Không thể gửi yêu cầu bổ nhiệm. Vui lòng thử lại.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <NavigationUser />
      <div style={styles.container}>
        <h2 style={styles.title}>Trạng thái bổ nhiệm của bạn</h2>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Vị Trí Hiện Tại:</label>
            <input
              style={styles.input}
              type="text"
              value={currentPosition}
              readOnly
              disabled
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Vị Trí Mới:</label>
            <input
              style={styles.input}
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Nhập vị trí mới"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Lý Do:</label>
            <textarea
              style={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do bổ nhiệm"
              required
            ></textarea>
          </div>
          <button type="submit" style={styles.submitBtn}>Gửi yêu cầu bổ nhiệm</button>
        </form>

        <h3 style={styles.subtitle}>Danh sách yêu cầu bổ nhiệm</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Vị Trí Cũ</th>
                <th style={styles.tableHeader}>Vị Trí Mới</th>
                <th style={styles.tableHeader}>Lý Do</th>
                <th style={styles.tableHeader}>Trạng Thái</th>
                <th style={styles.tableHeader}>Ngày Tạo</th>
                <th style={styles.tableHeader}>Phản Hồi HR</th>
                <th style={styles.tableHeader}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{appointment.oldPosition}</td>
                  <td style={styles.tableCell}>{appointment.newPosition}</td>
                  <td style={styles.tableCell}>{appointment.reason}</td>
                  <td style={styles.tableCell}>
                    <StatusBadge status={appointment.status}>
                      {getStatusText(appointment.status)}
                    </StatusBadge>
                  </td>
                  <td style={styles.tableCell}>
                    {new Date(appointment.createdAt).toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {appointment.hrFeedback || 'Chưa có phản hồi'}
                  </td>
                  <td style={styles.tableCell}>
                    {appointment.status === 'pending' && (
                      <button
                        style={styles.cancelBtn}
                        onClick={() => handleCancel(appointment._id)}
                        disabled={loading}
                      >
                        {loading ? 'Đang xử lý...' : 'Hủy yêu cầu'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const styles = {
  page: {
    backgroundColor: '#f4f7f9',
    minHeight: '100vh',
  },
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
    color: '#2c3e50',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  subtitle: {
    fontSize: '24px',
    marginTop: '40px',
    marginBottom: '20px',
    color: '#34495e',
    fontWeight: '600',
  },
  form: {
    marginBottom: '40px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#34495e',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    minHeight: '100px',
  },
  submitBtn: {
    padding: '12px 24px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
  },
  tableHeader: {
    backgroundColor: '#34495e',
    color: '#ffffff',
    padding: '15px',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: '600',
  },
  tableRow: {
    backgroundColor: '#f8fafc',
    transition: 'background-color 0.3s ease',
  },
  tableCell: {
    padding: '15px',
    fontSize: '16px',
    color: '#2c3e50',
    borderBottom: '1px solid #ecf0f1',
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};



export default AppointmentStatus;