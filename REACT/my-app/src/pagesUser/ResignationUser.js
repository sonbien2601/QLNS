import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationUser from '../components/NavigationUser';

const MySwal = withReactContent(Swal);

const ResignationUser = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://localhost:5000/api/auth/user-resignation/${userId}`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Vui lòng nhập lý do nghỉ việc.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/resignation-request', 
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setReason('');
      MySwal.fire({
        icon: 'success',
        title: 'Gửi yêu cầu thành công!',
        text: 'Yêu cầu nghỉ việc của bạn đã được gửi.',
      });
      fetchResignations();
    } catch (error) {
      console.error('Error submitting resignation request:', error);
      handleApiError(error);
    } finally {
      setSubmitting(false);
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
        fetchResignations();
      }
    } catch (error) {
      console.error('Error canceling resignation request:', error);
      let errorMessage = 'Đã xảy ra lỗi khi hủy yêu cầu. Vui lòng thử lại.';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
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

  return (
    <PageContainer>
      <NavigationUser />
      <ContentContainer>
        <Title>Yêu cầu nghỉ việc</Title>
        <FormContainer onSubmit={handleSubmit}>
          <StyledTextarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do nghỉ việc"
            required
          />
          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </SubmitButton>
        </FormContainer>
        <SubTitle>Lịch sử yêu cầu nghỉ việc</SubTitle>
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
                  <p><strong>Lý do:</strong> {resignation.reason}</p>
                  <p><strong>Trạng thái:</strong> <StatusBadge status={resignation.status}>{resignation.status}</StatusBadge></p>
                  <p><strong>Ngày yêu cầu:</strong> {new Date(resignation.submittedAt).toLocaleString()}</p>
                  {resignation.processedAt && (
                    <p><strong>Ngày xử lý:</strong> {new Date(resignation.processedAt).toLocaleString()}</p>
                  )}
                  {resignation.adminResponse && (
                    <p><strong>Phản hồi của admin:</strong> {resignation.adminResponse}</p>
                  )}
                  {resignation.status === 'pending' && (
                    <CancelButton onClick={() => handleCancelResignation(resignation._id)}>
                      Hủy yêu cầu
                    </CancelButton>
                  )}
                </ResignationItem>
              ))}
            </AnimatePresence>
          </ResignationList>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

// Styled components (same as before)
const PageContainer = styled.div`
  background-color: #f4f7f9;
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h2`
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
`;

const SubTitle = styled.h3`
  color: #34495e;
  font-size: 22px;
  margin-top: 40px;
  margin-bottom: 20px;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledTextarea = styled.textarea`
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const SubmitButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: flex-start;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(SubmitButton)`
  background-color: #e74c3c;
  &:hover {
    background-color: #c0392b;
  }
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

export default ResignationUser;
