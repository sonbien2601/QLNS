import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';

const MySwal = withReactContent(Swal);

// Styled Components
const PageContainer = styled.div`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h2`
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 20px;
  text-align: center;
`;

const SubTitle = styled.p`
  color: #34495e;
  font-size: 18px;
  margin-bottom: 30px;
  text-align: center;
`;

const Table = styled.table`
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

const Td = styled.td`
  background-color: #ffffff;
  padding: 15px;
  border-top: 1px solid #ecf0f1;
  border-bottom: 1px solid #ecf0f1;
`;

const Button = styled.button`
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
`;

const AppointmentDetails = styled.div`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 30px;
`;

// Component hiển thị từng dòng bổ nhiệm
const AppointmentRow = ({ id, name, oldPosition, newPosition, status, reason, createdAt, approvedAt, rejectedAt, handleApprove, handleReject, handleView, handleDelete }) => {
    if (!name) {
        return null;
    }

    return (
        <tr>
            <Td>{name}</Td>
            <Td>{oldPosition}</Td>
            <Td>{newPosition}</Td>
            <Td>{status}</Td>
            <Td>{new Date(createdAt).toLocaleString()}</Td>
            <Td>{approvedAt ? new Date(approvedAt).toLocaleString() : rejectedAt ? new Date(rejectedAt).toLocaleString() : 'Chưa xử lý'}</Td>
            <Td>
                <Button className="view-btn" onClick={() => handleView(id)}>Xem chi tiết</Button>
                <Button className="approve-btn" onClick={() => handleApprove(id)}>Phê duyệt</Button>
                <Button className="reject-btn" onClick={() => handleReject(id)}>Từ chối</Button>
                <Button className="delete-btn" onClick={() => handleDelete(id)}>Xóa yêu cầu</Button>
            </Td>
        </tr>
    );
}

const AppointmentTable = ({ appointments, handleApprove, handleReject, handleView, handleDelete }) => {
    return (
        <Table>
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
        </Table>
    );
};

// Component chính: Trang bổ nhiệm
const Appointment = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/auth/get-appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAppointments(response.data.appointments);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bổ nhiệm', error);
            MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tải danh sách bổ nhiệm. Vui lòng thử lại sau.',
            });
        }
    };

    const handleView = (appointmentId) => {
        const appointment = appointments.find((app) => app._id === appointmentId);
        setSelectedAppointment(appointment);
    };

    const handleApprove = async (appointmentId) => {
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
                await axios.put(`http://localhost:5000/api/auth/approve-appointment/${appointmentId}`, null, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                MySwal.fire(
                    'Đã phê duyệt!',
                    'Yêu cầu bổ nhiệm đã được phê duyệt thành công.',
                    'success'
                );
                fetchAppointments();
            } catch (error) {
                console.error('Lỗi khi phê duyệt yêu cầu bổ nhiệm', error);
                MySwal.fire(
                    'Lỗi!',
                    'Có lỗi xảy ra khi phê duyệt yêu cầu. Vui lòng thử lại.',
                    'error'
                );
            }
        }
    };

    const handleReject = async (appointmentId) => {
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
                await axios.put(`http://localhost:5000/api/auth/reject-appointment/${appointmentId}`, null, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                MySwal.fire(
                    'Đã từ chối!',
                    'Yêu cầu bổ nhiệm đã bị từ chối.',
                    'success'
                );
                fetchAppointments();
            } catch (error) {
                console.error('Lỗi khi từ chối yêu cầu bổ nhiệm', error);
                MySwal.fire(
                    'Lỗi!',
                    'Có lỗi xảy ra khi từ chối yêu cầu. Vui lòng thử lại.',
                    'error'
                );
            }
        }
    };

    const handleDelete = async (appointmentId) => {
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
                await axios.delete(`http://localhost:5000/api/auth/delete-appointment/${appointmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                MySwal.fire(
                    'Đã xóa!',
                    'Yêu cầu bổ nhiệm đã được xóa thành công.',
                    'success'
                );
                fetchAppointments();
            } catch (error) {
                console.error('Lỗi khi xóa yêu cầu bổ nhiệm', error);
                MySwal.fire(
                    'Lỗi!',
                    'Có lỗi xảy ra khi xóa yêu cầu. Vui lòng thử lại.',
                    'error'
                );
            }
        }
    };

    return (
        <PageContainer>
            <NavigationAdmin />
            <ContentContainer>
                <Title>Quản lý Bổ nhiệm</Title>
                <SubTitle>Dưới đây là danh sách các nhân viên được bổ nhiệm:</SubTitle>
                <AppointmentTable
                    appointments={appointments}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    handleView={handleView}
                    handleDelete={handleDelete}
                />
                {selectedAppointment && (
                    <AppointmentDetails>
                        <h3>Chi tiết bổ nhiệm</h3>
                        <p><strong>Tên nhân viên:</strong> {selectedAppointment.userId.fullName}</p>
                        <p><strong>Vị trí cũ:</strong> {selectedAppointment.oldPosition}</p>
                        <p><strong>Vị trí mới:</strong> {selectedAppointment.newPosition}</p>
                        <p><strong>Lý do:</strong> {selectedAppointment.reason}</p>
                        <p><strong>Trạng thái:</strong> {selectedAppointment.status}</p>
                    </AppointmentDetails>
                )}
            </ContentContainer>
        </PageContainer>
    );
}

// Thêm styles cho SweetAlert
const SweetAlertStyles = `
    .swal2-popup {
        font-size: 1rem;
    }
    .swal2-title {
        font-size: 1.5rem;
    }
    .swal2-content {
        font-size: 1rem;
    }
    .swal2-confirm,
    .swal2-cancel {
        font-size: 1rem;
        padding: 10px 20px;
    }
`;

const styleElement = document.createElement('style');
styleElement.innerHTML = SweetAlertStyles;
document.head.appendChild(styleElement);

export default Appointment;