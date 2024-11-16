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

const LeaveRequestItem = styled(motion.div)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);

  p {
    margin: 8px 0;
    color: #34495e;
  }
`;

const ResignationAdmin = () => {
  const navigate = useNavigate();
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchInitialData();
    }
  }, [navigate]);

  const fetchInitialData = async () => {
    try {
      const resignationsRes = await fetchResignations();
      const leaveRequestsRes = await fetchAllLeaveRequests();
      
      const allRequests = [
        ...(resignationsRes.resignations || []).map(r => ({ ...r, type: 'resignation', returnDate: r.returnDate || '' })),
        ...(leaveRequestsRes || []).map(l => ({ ...l, type: 'leave', returnDate: l.returnDate || '' }))
      ];
      
      setResignations(allRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      handleApiError(error);
    }
  };

    // Hàm mới để kiểm tra và format ngày đi làm lại
    const formatReturnDate = (request) => {
      if (request.type === 'leave') {
        const endDate = new Date(request.endDate);
        return endDate.toLocaleDateString();
      } else {
        return request.returnDate || 'N/A';
      }
    };

  const fetchResignations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/resignation-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching resignations:', error);
      handleApiError(error);
      return { resignations: [] };
    }
  };

  const fetchAllLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/all-leave-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.requests;
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      handleApiError(error);
      return [];
    }
  };


  const handleStatusUpdate = async (id, type, status, adminResponse) => {
    try {
      // Nếu là phê duyệt nghỉ việc, hiển thị cảnh báo trước
      if (type === 'resignation' && status === 'approved') {
        const confirmResult = await MySwal.fire({
          title: 'Xác nhận phê duyệt nghỉ việc?',
          text: "Khi phê duyệt nghỉ việc, tài khoản và tất cả dữ liệu của nhân viên sẽ bị xóa vĩnh viễn! Bạn có chắc chắn?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Xác nhận',
          cancelButtonText: 'Hủy'
        });
  
        if (!confirmResult.isConfirmed) {
          return;
        }
      }
  
      let response = adminResponse;
      
      if (status === 'rejected') {
        const { value: rejectionReason } = await MySwal.fire({
          title: 'Nhập lý do từ chối',
          input: 'text',
          inputLabel: 'Lý do',
          inputPlaceholder: 'Nhập lý do từ chối',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Xác nhận',
          cancelButtonText: 'Hủy',
          inputValidator: (value) => {
            if (!value) {
              return 'Bạn cần nhập lý do từ chối!';
            }
          }
        });
  
        if (!rejectionReason) return;
        response = rejectionReason;
      }
  
      const token = localStorage.getItem('token');
      const url = type === 'resignation'
        ? `http://localhost:5000/api/auth/resignation-requests/${id}`
        : `http://localhost:5000/api/auth/leave-requests/${id}`;
  
      await axios.put(url, 
        { status, adminResponse: response },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
  
      await MySwal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: type === 'resignation' && status === 'approved' 
          ? 'Đã phê duyệt nghỉ việc và xóa tài khoản nhân viên' 
          : `Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} yêu cầu ${type === 'resignation' ? 'nghỉ việc' : 'nghỉ phép'}`,
        showConfirmButton: false,
        timer: 1500
      });
  
      await fetchInitialData();
  
    } catch (error) {
      console.error('Error updating request:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Đã có lỗi xảy ra'
      });
    }
  };

  

  const handleDeleteResignation = async (id, type) => {
    try {
      const result = await MySwal.fire({
        title: 'Xác nhận xóa?',
        text: "Bạn không thể hoàn tác sau khi xóa!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const url = type === 'resignation'
          ? `http://localhost:5000/api/auth/resignation-requests/${id}`
          : `http://localhost:5000/api/auth/leave-requests/${id}`;

        await axios.delete(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        await MySwal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: `Đã xóa yêu cầu ${type === 'resignation' ? 'nghỉ việc' : 'nghỉ phép'}`,
          showConfirmButton: false,
          timer: 1500
        });

        await fetchInitialData();
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể xóa yêu cầu'
      });
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
          <RequestTypeFilter>
            <FilterButton 
              active={requestType === 'all'} 
              onClick={() => setRequestType('all')}
            >
              Tất cả
            </FilterButton>
            <FilterButton 
              active={requestType === 'resignation'} 
              onClick={() => setRequestType('resignation')}
            >
              Nghỉ việc
            </FilterButton>
            <FilterButton 
              active={requestType === 'leave'} 
              onClick={() => setRequestType('leave')}
            >
              Nghỉ phép
            </FilterButton>
          </RequestTypeFilter>
          
          {loading ? (
            <Loading>Đang tải dữ liệu...</Loading>
          ) : (
            <ResignationList>
              <AnimatePresence>
                {resignations
                  .filter(request => 
                    requestType === 'all' ? true : request.type === requestType
                  )
                  .map((resignation) => (
                    <ResignationItem
                      key={resignation._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h3>{resignation.userId?.fullName || 'Không có tên'}</h3>
                      <p><strong>Loại yêu cầu:</strong> {resignation.type === 'resignation' ? 'Nghỉ việc' : 'Nghỉ phép'}</p>
                      <p><strong>Lý do:</strong> {resignation.reason}</p>
                      <p><strong>Ngày yêu cầu:</strong> {new Date(resignation.requestedAt || resignation.submittedAt).toLocaleString()}</p>
                      <p><strong>Trạng thái:</strong> <StatusBadge status={resignation.status}>{resignation.status}</StatusBadge></p>
                      {resignation.adminResponse && (
                        <p><strong>Phản hồi:</strong> {resignation.adminResponse}</p>
                      )}
                      {resignation.type === 'leave' && (
                        <p><strong>Ngày đi làm lại:</strong> {formatReturnDate(resignation)}</p>
                      )}
                      <ButtonGroup>
                        {resignation.status === 'pending' && (
                          <>
                            <ApproveButton onClick={() => handleStatusUpdate(
                              resignation._id,
                              resignation.type,
                              'approved',
                              'Đồng ý'
                            )}>
                              Phê duyệt
                            </ApproveButton>
                            <RejectButton onClick={() => handleStatusUpdate(
                              resignation._id,
                              resignation.type,
                              'rejected'
                            )}>
                              Từ chối
                            </RejectButton>
                          </>
                        )}
                      </ButtonGroup>
                      <DeleteButton onClick={() => handleDeleteResignation(
                        resignation._id,
                        resignation.type
                      )}>
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

// Styled components (giữ nguyên phần này)
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

const RequestTypeFilter = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  background-color: ${props => props.active ? '#3498db' : '#ecf0f1'};
  color: ${props => props.active ? 'white' : '#34495e'};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#bdc3c7'};
  }
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