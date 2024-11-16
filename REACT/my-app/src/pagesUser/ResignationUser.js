import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled, { createGlobalStyle } from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationUser from '../components/NavigationUser';

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

  .swal2-textarea {
    min-height: 100px !important;
    padding: 10px !important;
  }
`;

const ResignationUser = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [resignations, setResignations] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const [resignationsResponse, leaveRequestsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/auth/user-resignation/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/auth/my-leave-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Format the data to match the combined structure
      const formattedResignations = resignationsResponse.data.resignations.map(item => ({
        ...item,
        type: 'resignation'
      }));
      const formattedLeaveRequests = leaveRequestsResponse.data.requests.map(item => ({
        ...item,
        type: 'leave'
      }));

      setResignations(formattedResignations);
      setLeaveRequests(formattedLeaveRequests);
    } catch (error) {
      console.error('Error fetching data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRequest = async () => {
    try {
      const { value: formValues } = await MySwal.fire({
        title: 'Xin nghỉ phép',
        html: `
          <div class="swal2-custom-container">
            <div class="mb-3">
              <label for="startDate">Ngày bắt đầu:</label>
              <input type="date" id="startDate" class="swal2-input-custom" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="mb-3">
              <label for="endDate">Ngày kết thúc:</label>
              <input type="date" id="endDate" class="swal2-input-custom" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="mb-3">  
              <label for="leaveReason">Lý do:</label>
              <textarea id="leaveReason" class="swal2-input-custom" rows="3" placeholder="Nhập lý do nghỉ phép"></textarea>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Gửi yêu cầu',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          const startDate = document.getElementById('startDate').value;
          const endDate = document.getElementById('endDate').value;
          const reason = document.getElementById('leaveReason').value;
          
          if (!startDate || !endDate || !reason) {
            MySwal.showValidationMessage('Vui lòng điền đầy đủ thông tin');
            return false;
          }
          
          if (new Date(endDate) < new Date(startDate)) {
            MySwal.showValidationMessage('Ngày kết thúc phải sau ngày bắt đầu');
            return false;
          }
          
          return { startDate, endDate, reason, returnDate: endDate };
        }
      });

      if (formValues) {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/auth/leave-request',
          formValues,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.data) {
          await MySwal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Yêu cầu nghỉ phép đã được gửi.',
            showConfirmButton: false,
            timer: 1500
          });
          
          await fetchData();
        }
      }
    } catch (error) {
      console.error('Leave request error:', error);
      handleApiError(error);
    }
  };

  const handleResignationRequest = async () => {
    try {
      const { value: reason } = await MySwal.fire({
        title: 'Xin nghỉ việc',
        input: 'textarea',
        inputLabel: 'Lý do nghỉ việc',
        inputPlaceholder: 'Nhập lý do nghỉ việc của bạn...',
        inputAttributes: {
          'aria-label': 'Nhập lý do nghỉ việc của bạn'
        },
        showCancelButton: true,
        confirmButtonText: 'Gửi yêu cầu',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
          if (!value) {
            return 'Bạn cần nhập lý do nghỉ việc!';
          }
        }
      });

      if (reason) {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/auth/resignation-request',
          { reason },
          { headers: { 'Authorization': `Bearer ${token}` }}
        );

        await MySwal.fire({
          icon: 'success',
          title: 'Đã gửi yêu cầu!',
          text: 'Yêu cầu nghỉ việc của bạn đã được gửi.',
          showConfirmButton: false,
          timer: 1500
        });

        await fetchData();
      }
    } catch (error) {
      console.error('Error submitting resignation:', error);
      handleApiError(error);
    }
  };

  const handleCancelResignation = async (id) => {
    try {
      const result = await MySwal.fire({
        title: 'Bạn chắc chắn muốn hủy yêu cầu?',
        text: "Hành động này không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Không'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/auth/user-resignation/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        MySwal.fire(
          'Đã hủy!',
          'Yêu cầu nghỉ việc của bạn đã được hủy.',
          'success'
        );
        fetchData();
      }
    } catch (error) {
      console.error('Error canceling resignation request:', error);
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

  // Combine all requests for display
  const allRequests = [...resignations, ...leaveRequests].sort((a, b) => 
    new Date(b.submittedAt || b.requestedAt) - new Date(a.submittedAt || a.requestedAt)
  );

  return (
    <>
      <GlobalStyle />
      <PageContainer>
        <NavigationUser />
        <ContentContainer>
          <Title>Quản lý nghỉ phép</Title>
          <ButtonContainer>
            <ActionButton onClick={handleResignationRequest}>
              Xin nghỉ việc
            </ActionButton>
            <ActionButton onClick={handleLeaveRequest}>
              Xin nghỉ phép
            </ActionButton>
          </ButtonContainer>

          {loading ? (
            <Loading>Đang tải...</Loading>
          ) : (
            <RequestList>
              <AnimatePresence>
                {allRequests.map((request) => (
                  <RequestItem
                    key={request._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <RequestHeader>
                      <RequestType>
                        {request.type === 'leave' ? 'Nghỉ phép' : 'Nghỉ việc'}
                      </RequestType>
                      <StatusBadge status={request.status}>
                        {request.status === 'pending' ? 'Đang chờ' :
                         request.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                      </StatusBadge>
                    </RequestHeader>
                    <RequestDetails>
                      {request.type === 'leave' ? (
                        <>
                          <p><strong>Ngày bắt đầu:</strong> {new Date(request.startDate).toLocaleDateString()}</p>
                          <p><strong>Ngày kết thúc:</strong> {new Date(request.endDate).toLocaleDateString()}</p>
                        </>
                      ) : (
                        <p><strong>Ngày yêu cầu:</strong> {new Date(request.submittedAt || request.requestedAt).toLocaleDateString()}</p>
                      )}
                      <p><strong>Lý do:</strong> {request.reason}</p>
                      {request.adminResponse && (
                        <p><strong>Phản hồi:</strong> {request.adminResponse}</p>
                      )}
                      {request.type === 'resignation' && request.status === 'pending' && (
                        <CancelButton onClick={() => handleCancelResignation(request._id)}>
                          Hủy yêu cầu
                        </CancelButton>
                      )}
                    </RequestDetails>
                  </RequestItem>
                ))}
              </AnimatePresence>
            </RequestList>
          )}
        </ContentContainer>
      </PageContainer>
    </>
  );
};

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
  margin-bottom: 30px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #3498db;
  color: white;

  &:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
  }
`;

const CancelButton = styled(ActionButton)`
  background-color: #e74c3c;
  margin-top: 15px;

  &:hover {
    background-color: #c0392b;
  }
`;

const Loading = styled.p`
  text-align: center;
  font-size: 18px;
  color: #34495e;
`;

const RequestList = styled.div`
  display: grid;
  gap: 20px;
`;

const RequestItem = styled(motion.div)`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const RequestType = styled.h3`
  font-size: 18px;
  color: #2c3e50;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background-color: ${props => {
    switch (props.status) {
      case 'approved':
        return '#2ecc71';
      case 'rejected':
        return '#e74c3c';
      default:
        return '#f39c12';
    }
  }};
`;

const RequestDetails = styled.div`
  p {
    margin: 8px 0;
    color: #34495e;
  }
`;

export default ResignationUser;