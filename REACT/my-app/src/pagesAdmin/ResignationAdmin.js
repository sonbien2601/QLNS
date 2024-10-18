import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled, { createGlobalStyle } from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationAdmin from '../components/NavigationAdmin';

const MySwal = withReactContent(Swal);

const GlobalStyle = createGlobalStyle`
  .swal2-input-custom {
    width: 100% !important;
    padding: 10px !important;
    margin: 5px 0 !important;
    border-radius: 5px !important;
  }

  .swal2-custom-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  .swal2-popup {
    max-width: 500px !important;
    padding: 1.5em !important;
  }

  .swal2-title {
    font-size: 1.4em !important;
    margin-bottom: 0.5em !important;
  }

  .swal2-content {
    font-size: 1em !important;
  }
`;

const ResignationAdmin = () => {
  const navigate = useNavigate();
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchResignations();
    }
  }, [navigate]);

  const fetchResignations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/resignation-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setResignations(response.data.resignations);
    } catch (error) {
      console.error('Error fetching resignations:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };


  const handleStatusUpdate = async (id, status, adminResponse) => {
    try {
      let response = adminResponse;
      if (status === 'rejected') {
        const { value: rejectionReason } = await MySwal.fire({
          title: 'Nhập lý do từ chối',
          input: 'text',
          inputLabel: 'Lý do',
          inputPlaceholder: 'Nhập lý do từ chối yêu cầu nghỉ việc',
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'Bạn cần nhập lý do từ chối!';
            }
          },
          customClass: {
            input: 'swal2-input-custom',
          },
        });
        if (rejectionReason) {
          response = rejectionReason;
        } else {
          return;
        }
      } else if (status === 'approved') {
        const confirmResult = await MySwal.fire({
          title: 'Xác nhận chấp nhận nghỉ việc',
          text: "Hành động này sẽ xóa toàn bộ thông tin của nhân viên khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Đồng ý',
          cancelButtonText: 'Hủy'
        });

        if (!confirmResult.isConfirmed) {
          return;
        }
      }

      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/auth/resignation-requests/${id}`, 
        { status, adminResponse: response },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      let message = status === 'approved' 
        ? 'Yêu cầu nghỉ việc đã được chấp nhận và thông tin nhân viên đã bị xóa khỏi hệ thống.'
        : `Yêu cầu nghỉ việc đã được ${status === 'rejected' ? 'từ chối' : 'cập nhật'}.`;

      MySwal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        text: message,
      });
      fetchResignations();
    } catch (error) {
      console.error('Error updating resignation status:', error);
      handleApiError(error);
    }
  };

  const handleDeleteResignation = async (id) => {
    try {
      const result = await MySwal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/auth/resignation-requests/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        MySwal.fire(
          'Đã xóa!',
          'Yêu cầu nghỉ việc đã được xóa.',
          'success'
        );
        fetchResignations();
      }
    } catch (error) {
      console.error('Error deleting resignation request:', error);
      handleApiError(error);
    }
  };

  const handleApiError = (error) => {
    let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
      if (error.response.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
    MySwal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: errorMessage,
    });
  };

  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <NavigationAdmin />
        <ContentContainer>
          <Title>Quản lý yêu cầu nghỉ việc</Title>
          {loading ? (
            <Loading>Đang tải dữ liệu...</Loading>
          ) : (
            <ResignationList>
              <AnimatePresence>
                {resignations.map((resignation) => (
                  <ResignationItem
                    key={resignation._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3>{resignation.userId?.fullName || 'Không có tên'}</h3>
                    <p><strong>Lý do:</strong> {resignation.reason}</p>
                    <p><strong>Trạng thái:</strong> <StatusBadge status={resignation.status}>{resignation.status}</StatusBadge></p>
                    <p><strong>Ngày yêu cầu:</strong> {new Date(resignation.submittedAt).toLocaleString()}</p>
                    {resignation.processedAt && (
                      <p><strong>Ngày xử lý:</strong> {new Date(resignation.processedAt).toLocaleString()}</p>
                    )}
                    {resignation.adminResponse && (
                      <p><strong>Phản hồi:</strong> {resignation.adminResponse}</p>
                    )}
                    <ButtonGroup>
                      {resignation.status === 'pending' && (
                        <>
                          <ApproveButton onClick={() => handleStatusUpdate(resignation._id, 'approved', 'Đồng ý')}>
                            Phê duyệt
                          </ApproveButton>
                          <RejectButton onClick={() => handleStatusUpdate(resignation._id, 'rejected')}>
                            Từ chối
                          </RejectButton>
                        </>
                      )}
                      {resignation.status === 'rejected' && (
                        <ApproveButton onClick={() => handleStatusUpdate(resignation._id, 'approved', 'Đồng ý')}>
                          Thay đổi thành phê duyệt
                        </ApproveButton>
                      )}
                      {resignation.status === 'approved' && (
                        <RejectButton onClick={() => handleStatusUpdate(resignation._id, 'rejected')}>
                          Thay đổi thành từ chối
                        </RejectButton>
                      )}
                    </ButtonGroup>
                    <DeleteButton onClick={() => handleDeleteResignation(resignation._id)}>
                      Xóa yêu cầu
                    </DeleteButton>
                  </ResignationItem>
                ))}
              </AnimatePresence>
            </ResignationList>
          )}
        </ContentContainer>
      </PageContainer>
    </>
  );
};

// Styled components
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
  margin-bottom: 30px;
  text-align: center;
`;

const Loading = styled.p`
  text-align: center;
  font-size: 18px;
  color: #34495e;
`;

const ResignationList = styled.div`
  display: grid;
  gap: 20px;
`;

const ResignationItem = styled(motion.div)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
`;

const ApproveButton = styled(Button)`
  background-color: #2ecc71;
  color: white;
  &:hover {
    background-color: #27ae60;
  }
`;

const RejectButton = styled(Button)`
  background-color: #e74c3c;
  color: white;
  &:hover {
    background-color: #c0392b;
  }
`;

const EditButton = styled(Button)`
  background-color: #3498db;
  color: white;
  &:hover {
    background-color: #2980b9;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #95a5a6;
  color: white;
  margin-top: 10px;
  &:hover {
    background-color: #7f8c8d;
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  color: white;
  background-color: ${props => {
    switch(props.status) {
      case 'approved':
        return '#2ecc71';
      case 'rejected':
        return '#e74c3c';
      default:
        return '#f39c12';
    }
  }};
`;

export default ResignationAdmin;
