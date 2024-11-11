import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const MySwal = withReactContent(Swal);

const ContractAdmin = () => {
  const [contracts, setContracts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Không tìm thấy token');
        }
  
        // Decode token để lấy role
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken.role;
  
        // Kiểm tra quyền truy cập
        if (!['admin', 'hr'].includes(userRole)) {
          MySwal.fire({
            icon: 'error',
            title: 'Không có quyền truy cập!',
            text: 'Bạn không có quyền truy cập trang này.',
            confirmButtonColor: '#d33',
          }).then(() => {
            navigate('/');
          });
          return;
        }
  
        // Hiển thị thông báo cho HR
        if (userRole === 'hr') {
          MySwal.fire({
            icon: 'info',
            title: 'Lưu ý!',
            text: 'Các thay đổi thông tin hợp đồng sẽ cần được Admin phê duyệt trước khi có hiệu lực.',
            confirmButtonColor: '#3085d6',
          });
        }
  
        // Fetch dữ liệu hợp đồng
        await fetchContracts();
      } catch (error) {
        console.error('Lỗi khởi tạo:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
        setError('Có lỗi xảy ra khi tải dữ liệu');
      }
    };
  
    init();
  }, [navigate]);

  const getContractTypeDisplay = (type) => {
    switch (type) {
      case 'fullTime':
        return 'Toàn thời gian';
      case 'partTime':
        return 'Bán thời gian';
      case 'temporary':
        return 'Tạm thời';
      default:
        return type || 'Không xác định';
    }
  };


  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/contracts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Không thể tải dữ liệu hợp đồng. Vui lòng thử lại sau.');
      setLoading(false);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải dữ liệu hợp đồng. Vui lòng thử lại sau.',
      });
    }
  };

  const handleEdit = (contract) => {
    setCurrentContract(contract);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setCurrentContract(null);
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;
  
      if (userRole === 'hr') {
        // HR - Gửi yêu cầu phê duyệt
        const response = await axios.post(
          'http://localhost:5000/api/auth/approval-request',
          {
            requestType: 'update_contract',
            requestData: {
              contractId: currentContract._id,
              updateData: {
                contractType: currentContract.contractType,
                startDate: currentContract.startDate,
                endDate: currentContract.endDate,
                status: currentContract.status
              },
              employeeId: currentContract.employeeId._id,
              oldData: {
                contractType: contracts.find(c => c._id === currentContract._id)?.contractType,
                startDate: contracts.find(c => c._id === currentContract._id)?.startDate,
                endDate: contracts.find(c => c._id === currentContract._id)?.endDate,
                status: contracts.find(c => c._id === currentContract._id)?.status
              }
            }
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
  
        handleCloseModal();
        MySwal.fire({
          icon: 'success',
          title: 'Đã gửi yêu cầu!',
          text: 'Yêu cầu cập nhật hợp đồng đã được gửi đến Admin để phê duyệt.',
          confirmButtonColor: '#3085d6'
        });
      } else {
        // Admin - Cập nhật trực tiếp
        const response = await axios.put(
          `http://localhost:5000/api/auth/contracts/${currentContract._id}`,
          {
            contractType: currentContract.contractType,
            startDate: currentContract.startDate,
            endDate: currentContract.endDate,
            status: currentContract.status
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
  
        await fetchContracts();
        handleCloseModal();
        MySwal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Cập nhật hợp đồng thành công!',
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      let errorMessage = 'Có lỗi xảy ra khi cập nhật hợp đồng';
  
      if (error.response?.status === 401) {
        errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
  
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleInputChange = (e) => {
    setCurrentContract({
      ...currentContract,
      [e.target.name]: e.target.value
    });
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;
  
      if (userRole !== 'admin') {
        MySwal.fire({
          icon: 'error',
          title: 'Không có quyền!',
          text: 'Chỉ Admin mới có quyền xóa hợp đồng.',
          confirmButtonColor: '#d33'
        });
        return;
      }
  
      const result = await MySwal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn không thể hoàn tác hành động này!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Có, xóa nó!',
        cancelButtonText: 'Hủy'
      });
  
      if (result.isConfirmed) {
        await axios.delete(`http://localhost:5000/api/auth/contracts/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        setContracts(prevContracts => prevContracts.filter(contract => contract._id !== userId));
  
        MySwal.fire(
          'Đã xóa!',
          'Hợp đồng đã được xóa thành công.',
          'success'
        );
      }
    } catch (error) {
      console.error('Lỗi khi xóa hợp đồng:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi xóa hợp đồng',
        confirmButtonColor: '#d33'
      });
    }
  };

  return (
    <PageContainer>
      <NavigationAdmin />
      <Wrapper>
        <ContentContainer
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Quản lý Hợp đồng Nhân viên</Title>
          {loading && <LoadingMessage>Đang tải dữ liệu...</LoadingMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {!loading && !error && (
            <AnimatePresence>
              {contracts.length === 0 ? (
                <NoContractMessage
                  as={motion.p}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Chưa có hợp đồng nào. Vui lòng thêm nhân viên mới.
                </NoContractMessage>
              ) : (
                <Table
                  as={motion.table}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <thead>
                    <tr>
                      <Th>Tên Nhân Viên</Th>
                      <Th>Chức Vụ</Th>
                      <Th>Loại Hợp Đồng</Th>
                      <Th>Ngày Bắt Đầu</Th>
                      <Th>Ngày Kết Thúc</Th>
                      <Th>Trạng Thái</Th>
                      <Th>Hành Động</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract, index) => (
                      <motion.tr
                        key={contract._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Td>{contract.employeeId.fullName}</Td>
                        <Td>{contract.employeeId.position}</Td>
                        <Td>{getContractTypeDisplay(contract.contractType)}</Td>
                        <Td>{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}</Td>
                        <Td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}</Td>
                        <Td>{contract.status}</Td>
                        <Td>
                          <Button
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(contract)}
                          >
                            Chỉnh sửa
                          </Button>
                          <DeleteButton
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(contract._id)}
                          >
                            Xóa
                          </DeleteButton>
                        </Td>
                      </motion.tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </AnimatePresence>
          )}

          <AnimatePresence>
            {showEditModal && (
              <ModalOverlay
                as={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ModalContent
                  as={motion.div}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                >
                  <ModalTitle>Chỉnh sửa Hợp đồng</ModalTitle>
                  {currentContract && (
                    <Form>
                      <FormGroup>
                        <Label>Loại Hợp Đồng:</Label>
                        <Select
                          name="contractType"
                          value={currentContract.contractType || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Chọn loại hợp đồng</option>
                          <option value="fullTime">Toàn thời gian</option>
                          <option value="partTime">Bán thời gian</option>
                          <option value="temporary">Tạm thời</option>
                        </Select>
                      </FormGroup>
                      <FormGroup>
                        <Label>Ngày Bắt Đầu:</Label>
                        <Input
                          type="date"
                          name="startDate"
                          value={currentContract.startDate ? currentContract.startDate.split('T')[0] : ''}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Ngày Kết Thúc:</Label>
                        <Input
                          type="date"
                          name="endDate"
                          value={currentContract.endDate ? currentContract.endDate.split('T')[0] : ''}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Trạng Thái:</Label>
                        <Select
                          name="status"
                          value={currentContract.status || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Chọn trạng thái</option>
                          <option value="Còn hiệu lực">Còn hiệu lực</option>
                          <option value="Hết hiệu lực">Hết hiệu lực</option>
                        </Select>
                      </FormGroup>
                    </Form>
                  )}
                  <ButtonGroup>
                    <Button
                      as={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      secondary
                      onClick={handleCloseModal}
                    >
                      Đóng
                    </Button>
                    <Button
                      as={motion.button}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveChanges}
                    >
                      Lưu thay đổi
                    </Button>
                  </ButtonGroup>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>
        </ContentContainer>
      </Wrapper>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  display: flex;
  background-color: #f4f7f9;
  min-height: 100vh;
`;
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-x: auto;
`;

const ContentContainer = styled.div`
  padding: 20px;
  flex: 1;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1000px; // Đảm bảo bảng không bị co lại quá nhỏ
  border-collapse: separate;
  border-spacing: 0;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  background-color: #f8f9fa;
  color: #333;
  font-weight: bold;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
`;

const Button = styled.button`
  background-color: ${props => props.secondary ? '#6c757d' : '#007bff'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  min-width: 100px;

  &:hover {
    background-color: ${props => props.secondary ? '#5a6268' : '#0056b3'};
  }
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545;

  &:hover {
    background-color: #c82333;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  margin-bottom: 10px;
`;

const LoadingMessage = styled.p`
  color: #007bff;
  font-weight: bold;
`;

const NoContractMessage = styled.p`
  color: #6c757d;
  font-style: italic;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 20px;
  font-size: 24px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 16px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

// SweetAlert styles
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

export default ContractAdmin;