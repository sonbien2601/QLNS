import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import NavigationAdmin from '../components/NavigationAdmin';
import { jwtDecode } from 'jwt-decode';

// Styled Components
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 24px;
  margin-left: 250px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background-color: ${props => props.isActive ? props.color || '#1a73e8' : '#fff'};
  color: ${props => props.isActive ? 'white' : '#64748b'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  box-shadow: ${props => props.isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
  border: 1px solid ${props => props.isActive ? 'transparent' : '#e2e8f0'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`;

const ApprovalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ApprovalCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #eef0f2;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #eef0f2;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RequestType = styled.span`
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.color) {
      case '#ffa726': return '#fff7ed';
      case '#66bb6a': return '#f0fdf4';
      case '#ef5350': return '#fef2f2';
      default: return '#f8fafc';
    }
  }};
  color: ${props => {
    switch (props.color) {
      case '#ffa726': return '#c2410c';
      case '#66bb6a': return '#15803d';
      case '#ef5350': return '#dc2626';
      default: return '#64748b';
    }
  }};
  border: 1px solid ${props => {
    switch (props.color) {
      case '#ffa726': return '#fdba74';
      case '#66bb6a': return '#86efac';
      case '#ef5350': return '#fca5a5';
      default: return '#e2e8f0';
    }
  }};
`;

const CardBody = styled.div`
  padding: 20px;
`;

const RequestInfo = styled.div`
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
`;

const Label = styled.span`
  font-weight: 500;
  color: #64748b;
  width: 120px;
  flex-shrink: 0;
  font-size: 14px;
`;

const Value = styled.span`
  color: #1e293b;
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
`;

const RequestDetails = styled.div`
  margin: 20px 0;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const DetailTable = styled.div`
  width: 100%;
  border-collapse: collapse;
`;

const DetailRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
  
  &:nth-child(odd) {
    background-color: #f8fafc;
  }
`;

const DetailLabel = styled.div`
  width: 200px;
  padding: 12px 16px;
  font-weight: 500;
  color: #64748b;
  border-right: 1px solid #e2e8f0;
`;

const DetailValue = styled.div`
  flex: 1;
  padding: 12px 16px;
  color: #1e293b;
`;


const CardActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const ApproveButton = styled(Button)`
  background-color: #22c55e;
  color: white;

  &:hover:not(:disabled) {
    background-color: #16a34a;
  }
`;

const RejectButton = styled(Button)`
  background-color: #ef4444;
  color: white;

  &:hover:not(:disabled) {
    background-color: #dc2626;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const NoDataMessage = styled(LoadingMessage)`
  color: #94a3b8;
`;

const ChangeValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const OldValue = styled.span`
  color: #ef4444;
  text-decoration: line-through;
  flex: 1;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #fee2e2;
`;

const NewValue = styled.span`
  color: #22c55e;
  flex: 1;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #dcfce7;
`;

const ChangeHeader = styled(DetailRow)`
  background-color: #f8fafc;
  font-weight: bold;
  border-bottom: 2px solid #e2e8f0;
`;


const ApprovalList = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');


  const filteredApprovals = approvals.filter(approval => {
    if (filter === 'all') return true;
    return approval.status === filter;
  });

  const handleApiError = (error) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: errorMessage
    });
  };

  // Validate ObjectId
  const isValidObjectId = (id) => {
    if (!id) {
      console.log('ID is null or undefined');
      return false;
    }
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isValid = objectIdPattern.test(String(id));
    console.log('ObjectId validation:', { id, isValid });
    return isValid;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'approved': return '#66bb6a';
      case 'rejected': return '#ef5350';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return 'Không xác định';
    }
  };

  const getRequestTypeText = (type) => {
    switch (type) {
      case 'create_user': return 'Tạo nhân viên mới';
      case 'update_user': return 'Cập nhật thông tin';
      case 'update_salary': return 'Cập nhật lương';
      case 'update_contract': return 'Cập nhật hợp đồng';
      case 'appointment_approval': return 'Phê duyệt bổ nhiệm';
      case 'dismissal_request': return 'Phê duyệt miễn nhiệm'; // Thêm case này
      default: return type;
    }
  };



  const formatRequestData = (data) => {
    if (!data) return 'Không có dữ liệu';

    try {
      if (typeof data === 'string') return data;

      const formattedData = {
        username: data.username || 'N/A',
        fullName: data.fullName || 'N/A',
        email: data.email || 'N/A',
        phoneNumber: data.phoneNumber || 'N/A',
        position: data.position || 'N/A',
        basicSalary: data.basicSalary ?
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(data.basicSalary) : 'N/A'
      };

      return JSON.stringify(formattedData, null, 2);
    } catch (error) {
      console.error('Error formatting request data:', error);
      return 'Lỗi hiển thị dữ liệu';
    }
  };

  const getChangedFields = (oldData, newData) => {
    const changes = {};
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    });
    return changes;
  };



  const formatContractFieldName = (field) => {
    const fieldMappings = {
      contractType: 'Loại hợp đồng',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
      basicSalary: 'Lương cơ bản',
      insuranceSalary: 'Lương đóng bảo hiểm',
      allowances: 'Phụ cấp',
      contractFile: 'File hợp đồng'
    };
    return fieldMappings[field] || field;
  };

  const formatContractValue = (field, value) => {
    if (!value) return 'N/A';

    switch (field) {
      case 'startDate':
      case 'endDate':
        return new Date(value).toLocaleDateString('vi-VN');

      case 'basicSalary':
      case 'insuranceSalary':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(value);

      case 'allowances':
        if (Array.isArray(value)) {
          return value.map(allowance =>
            `${allowance.name}: ${new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(allowance.amount)}`
          ).join(', ');
        }
        return value;

      case 'contractType':
        const contractTypes = {
          'full-time': 'Toàn thời gian',
          'part-time': 'Bán thời gian',
          'temporary': 'Tạm thời',
          'intern': 'Thực tập'
        };
        return contractTypes[value] || value;

      case 'contractFile':
        return value.name || value;

      default:
        return value;
    }
  };

  const formatFieldName = (fieldName) => {
    const nameMap = {
      username: 'Tên đăng nhập',
      fullName: 'Họ và tên',
      email: 'Email',
      phoneNumber: 'Số điện thoại',
      position: 'Chức vụ',
      basicSalary: 'Lương cơ bản',
      employeeType: 'Loại nhân viên',
      contractType: 'Loại hợp đồng',
      contractStart: 'Ngày bắt đầu hợp đồng',
      contractEnd: 'Ngày kết thúc hợp đồng',
      gender: 'Giới tính'
    };
    return nameMap[fieldName] || fieldName;
  };

  const formatValue = (fieldName, value) => {
    if (value === undefined || value === null) return 'N/A';

    switch (fieldName) {
      case 'basicSalary':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(value);
      case 'contractStart':
      case 'contractEnd':
        return new Date(value).toLocaleDateString('vi-VN');
      default:
        return value;
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      console.log('Fetching approvals...');
      const response = await axios({
        method: 'GET',
        url: 'http://localhost:5000/api/auth/approvals',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Approvals response:', response.data);

      if (response.data?.approvals) {
        const formattedApprovals = response.data.approvals.map(approval => ({
          ...approval,
          _id: approval._id || approval.id
        }));

        console.log('Formatted approvals:', formattedApprovals);
        setApprovals(formattedApprovals);
      } else {
        throw new Error('Định dạng dữ liệu không hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

const handleApprove = async (approval) => {
  try {
    if (!approval?._id) {
      throw new Error('Thông tin yêu cầu không hợp lệ');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const decodedToken = jwtDecode(token);
    const processedBy = decodedToken.userId || decodedToken.sub || decodedToken.id;

    if (!processedBy) {
      throw new Error('Không thể xác định người xử lý yêu cầu');
    }

    const result = await Swal.fire({
      title: 'Xác nhận phê duyệt',
      text: 'Bạn có chắc chắn muốn phê duyệt yêu cầu này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Phê duyệt',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      setActionLoading(true);

      try {
        // Xử lý phê duyệt dựa trên loại yêu cầu
        let response;

        switch (approval.requestType) {
          case 'update_user':
            // Cập nhật thông tin user
            await axios.put(
              `http://localhost:5000/api/auth/admin/user/${approval.requestData.userId}`,
              approval.requestData.updateData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;

          case 'create_user':
            // Tạo user mới
            await axios.post(
              'http://localhost:5000/api/auth/create-user',
              approval.requestData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;

          case 'update_contract':
            // Cập nhật hợp đồng
            await axios.put(
              `http://localhost:5000/api/auth/contracts/${approval.requestData.contractId}`,
              approval.requestData.updateData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;

          case 'appointment_approval':
            // Phê duyệt bổ nhiệm
            await axios.put(
              `http://localhost:5000/api/auth/approve-appointment/${approval.requestData.appointmentId}`,
              {
                status: 'approved',
                adminResponse: 'Đã phê duyệt bổ nhiệm',
                processedBy: processedBy
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
        }

        // Cập nhật trạng thái yêu cầu phê duyệt
        response = await axios.put(
          `http://localhost:5000/api/auth/approvals/${approval._id}`,
          {
            status: 'approved',
            adminResponse: 'Đã phê duyệt',
            processedBy: processedBy
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data) {
          throw new Error('Không nhận được phản hồi từ server');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Yêu cầu đã được phê duyệt',
          timer: 1500
        });

        // Tải lại danh sách yêu cầu
        await fetchApprovals();

      } catch (apiError) {
        console.error('API call failed:', apiError);
        let errorMessage = 'Đã có lỗi xảy ra khi phê duyệt';

        if (apiError.response) {
          switch (apiError.response.status) {
            case 400:
              errorMessage = apiError.response.data.message || 'Dữ liệu không hợp lệ';
              break;
            case 401:
              errorMessage = 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại';
              localStorage.removeItem('token');
              window.location.href = '/login';
              break;
            case 403:
              errorMessage = 'Bạn không có quyền thực hiện thao tác này';
              break;
            case 404:
              errorMessage = 'Không tìm thấy yêu cầu phê duyệt';
              break;
            case 500:
              errorMessage = apiError.response.data.error || 'Lỗi máy chủ';
              break;
            default:
              errorMessage = apiError.response.data.message || 'Lỗi không xác định';
          }
        }

        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: errorMessage
        });
      } finally {
        setActionLoading(false);
      }
    }
  } catch (error) {
    console.error('General error:', error);
    setActionLoading(false);
    await Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: error.message || 'Đã có lỗi xảy ra'
    });
  }
};

  const handleReject = async (approval) => {
    try {
      if (!approval?._id) {
        throw new Error('Thông tin yêu cầu không hợp lệ');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const decodedToken = jwtDecode(token);
      const processedBy = decodedToken.userId || decodedToken.sub || decodedToken.id;

      console.log('Decoded token:', decodedToken);
      console.log('ProcessedBy:', processedBy);

      if (!processedBy) {
        throw new Error('Không thể xác định người xử lý yêu cầu');
      }

      const { value: reason } = await Swal.fire({
        title: 'Lý do từ chối',
        input: 'textarea',
        inputLabel: 'Vui lòng nhập lý do từ chối',
        inputPlaceholder: 'Nhập lý do...',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
          if (!value?.trim()) return 'Vui lòng nhập lý do từ chối';
          return null;
        }
      });

      if (reason) {
        setActionLoading(true);

        try {
          console.log('Sending rejection request:', {
            approvalId: approval._id,
            reason: reason.trim(),
            processedBy
          });

          let response;
          let successMessage;

          if (approval.requestType === 'appointment_approval') {
            response = await axios({
              method: 'PUT',
              url: `http://localhost:5000/api/auth/approve-appointment/${approval.requestData.appointmentId}`,
              data: {
                status: 'approved',
                adminResponse: 'Đã phê duyệt bổ nhiệm',
                processedBy: processedBy
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            // Cập nhật luôn approval status
            await axios({
              method: 'PUT',
              url: `http://localhost:5000/api/auth/approvals/${approval._id}`,
              data: {
                status: 'approved',
                adminResponse: 'Đã phê duyệt bổ nhiệm',
                processedBy: processedBy
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } else {
            // Xử lý các loại yêu cầu khác
            response = await axios({
              method: 'PUT',
              url: `http://localhost:5000/api/auth/approvals/${approval._id}`,
              data: {
                status: 'rejected',
                adminResponse: reason.trim(),
                processedBy: processedBy
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            });
            successMessage = 'Yêu cầu đã được từ chối';
          }

          console.log('Rejection response:', response.data);

          if (!response.data) {
            throw new Error('Không nhận được phản hồi từ server');
          }

          await Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: successMessage,
            timer: 1500
          });

          await fetchApprovals();
        } catch (apiError) {
          console.error('API call failed:', {
            error: apiError,
            response: apiError.response?.data,
            status: apiError.response?.status
          });

          let errorMessage = 'Đã có lỗi xảy ra khi từ chối';

          if (apiError.response?.data?.error === 'ProcessedBy required when approving/rejecting') {
            errorMessage = 'Không thể xác định người xử lý yêu cầu';
          } else if (apiError.response) {
            switch (apiError.response.status) {
              case 400:
                errorMessage = apiError.response.data.message || 'Dữ liệu không hợp lệ';
                break;
              case 401:
                errorMessage = 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại';
                localStorage.removeItem('token');
                window.location.href = '/login';
                break;
              case 403:
                errorMessage = 'Bạn không có quyền thực hiện thao tác này';
                break;
              case 404:
                errorMessage = 'Không tìm thấy yêu cầu phê duyệt';
                break;
              case 500:
                errorMessage = apiError.response.data.error || 'Lỗi máy chủ';
                break;
              default:
                errorMessage = apiError.response.data.message || 'Lỗi không xác định';
            }
          } else if (apiError.request) {
            errorMessage = 'Không thể kết nối đến máy chủ';
          } else if (apiError.code === 'ECONNABORTED') {
            errorMessage = 'Yêu cầu đã quá thời gian chờ, vui lòng thử lại';
          }

          await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: errorMessage,
            showConfirmButton: true
          });
        } finally {
          setActionLoading(false);
        }
      }
    } catch (error) {
      console.error('General rejection error:', error);
      setActionLoading(false);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Đã có lỗi xảy ra khi từ chối yêu cầu',
        showConfirmButton: true
      });
    }
  };

  // Thêm hàm để validate token
  const validateToken = (token) => {
    try {
      const decodedToken = jwtDecode(token);
      console.log('Full decoded token:', decodedToken);

      // Kiểm tra thời hạn token
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        throw new Error('Token đã hết hạn');
      }

      // Kiểm tra role
      if (!decodedToken.role || decodedToken.role !== 'admin') {
        throw new Error('Không có quyền truy cập');
      }

      return decodedToken;
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  };


  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Không tìm thấy token');
        }

        // Validate token trước khi fetch data
        const decodedToken = validateToken(token);
        console.log('User info from token:', {
          userId: decodedToken.userId || decodedToken.sub || decodedToken.id,
          role: decodedToken.role
        });

        await fetchApprovals();
      } catch (error) {
        console.error('Initialization error:', error);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    };

    init();
  }, []);

  return (
    <PageContainer>
      <NavigationAdmin />
      <MainContent>
        <PageHeader>
          <h1>Danh sách yêu cầu phê duyệt</h1>
          <FilterContainer>
            <FilterButton
              isActive={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Tất cả
            </FilterButton>
            <FilterButton
              isActive={filter === 'pending'}
              onClick={() => setFilter('pending')}
              color="#ffa726"
            >
              Chờ duyệt
            </FilterButton>
            <FilterButton
              isActive={filter === 'approved'}
              onClick={() => setFilter('approved')}
              color="#66bb6a"
            >
              Đã duyệt
            </FilterButton>
            <FilterButton
              isActive={filter === 'rejected'}
              onClick={() => setFilter('rejected')}
              color="#ef5350"
            >
              Đã từ chối
            </FilterButton>
          </FilterContainer>
        </PageHeader>

        {loading ? (
          <LoadingMessage>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Đang tải dữ liệu...
            </motion.div>
          </LoadingMessage>
        ) : filteredApprovals.length === 0 ? (
          <NoDataMessage>Không có yêu cầu phê duyệt nào</NoDataMessage>
        ) : (
          <ApprovalGrid>
            {filteredApprovals.map((approval) => (
              <ApprovalCard
                key={approval._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CardHeader>
                  <RequestType>{getRequestTypeText(approval.requestType)}</RequestType>
                  <StatusBadge color={getStatusColor(approval.status)}>
                    {getStatusText(approval.status)}
                  </StatusBadge>
                </CardHeader>

                <CardBody>
                  <RequestInfo>
                    <InfoItem>
                      <Label>Người yêu cầu:</Label>
                      <Value>{approval.requestedBy?.fullName || 'N/A'}</Value>
                    </InfoItem>
                    <InfoItem>
                      <Label>Thời gian:</Label>
                      <Value>
                        {approval.createdAt ?
                          new Date(approval.createdAt).toLocaleString('vi-VN') :
                          'N/A'}
                      </Value>
                    </InfoItem>
                    {approval.adminResponse && (
                      <InfoItem>
                        <Label>Phản hồi:</Label>
                        <Value>{approval.adminResponse}</Value>
                      </InfoItem>
                    )}
                  </RequestInfo>

                  <RequestDetails>
                    <DetailTable>
                      {approval.requestType === 'dismiss_employee' ? (
                        <React.Fragment>
                          <DetailRow>
                            <DetailLabel>Nhân viên bị miễn nhiệm</DetailLabel>
                            <DetailValue>
                              {approval.requestData?.userId?.fullName ||
                                approval.requestData?.user?.fullName || // Thêm backup option
                                approval.requestedBy?.fullName || 'N/A'}
                            </DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Vị trí hiện tại</DetailLabel>
                            <DetailValue>{approval.requestData?.oldPosition || 'N/A'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Vị trí mới</DetailLabel>
                            <DetailValue>{approval.requestData?.newPosition || 'N/A'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Lý do</DetailLabel>
                            <DetailValue>{approval.requestData?.reason || 'N/A'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Ngày hiệu lực</DetailLabel>
                            <DetailValue>
                              {approval.requestData?.effectiveDate
                                ? new Date(approval.requestData.effectiveDate).toLocaleDateString('vi-VN')
                                : 'N/A'}
                            </DetailValue>
                          </DetailRow>
                        </React.Fragment>
                      ) :
                        approval.requestType === 'update_user' ? (
                          <React.Fragment>
                            <ChangeHeader>
                              <DetailLabel>Thông tin</DetailLabel>
                              <DetailValue>
                                <ChangeValue>
                                  <span>Giá trị cũ</span>
                                  <span>Giá trị mới</span>
                                </ChangeValue>
                              </DetailValue>
                            </ChangeHeader>
                            {Object.entries(
                              getChangedFields(approval.requestData.oldData, approval.requestData.updateData)
                            ).map(([field, values]) => (
                              <DetailRow key={field}>
                                <DetailLabel>{formatFieldName(field)}</DetailLabel>
                                <DetailValue>
                                  <ChangeValue>
                                    <OldValue>{formatValue(field, values.old)}</OldValue>
                                    <NewValue>{formatValue(field, values.new)}</NewValue>
                                  </ChangeValue>
                                </DetailValue>
                              </DetailRow>
                            ))}
                          </React.Fragment>
                        ) : approval.requestType === 'update_contract' ? (
                          <React.Fragment>
                            <ChangeHeader>
                              <DetailLabel>Thông tin hợp đồng</DetailLabel>
                              <DetailValue>
                                <ChangeValue>
                                  <span>Giá trị cũ</span>
                                  <span>Giá trị mới</span>
                                </ChangeValue>
                              </DetailValue>
                            </ChangeHeader>
                            {Object.entries(
                              getChangedFields(approval.requestData.oldData, approval.requestData.updateData)
                            ).map(([field, values]) => (
                              <DetailRow key={field}>
                                <DetailLabel>{formatContractFieldName(field)}</DetailLabel>
                                <DetailValue>
                                  <ChangeValue>
                                    <OldValue>{formatContractValue(field, values.old)}</OldValue>
                                    <NewValue>{formatContractValue(field, values.new)}</NewValue>
                                  </ChangeValue>
                                </DetailValue>
                              </DetailRow>
                            ))}
                          </React.Fragment>
                        ) : approval.requestType === 'appointment_approval' ? (
                          <React.Fragment>
                            <DetailRow>
                              <DetailLabel>Nhân viên được bổ nhiệm</DetailLabel>
                              <DetailValue>
                                {(() => {
                                  const appointmentData = approval.requestData;
                                  // Log để debug
                                  console.log('Appointment Data:', appointmentData);

                                  // Kiểm tra và lấy tên nhân viên theo thứ tự ưu tiên
                                  const employeeName =
                                    appointmentData?.user?.fullName || // Nếu có trong user
                                    appointmentData?.employee?.fullName || // Hoặc trong employee  
                                    appointmentData?.employeeName || // Hoặc trực tiếp trong data
                                    'N/A'; // Mặc định nếu không có

                                  return employeeName;
                                })()}
                              </DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Vị trí hiện tại</DetailLabel>
                              <DetailValue>{approval.requestData.oldPosition || 'N/A'}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Vị trí bổ nhiệm</DetailLabel>
                              <DetailValue>{approval.requestData.newPosition || 'N/A'}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Lý do bổ nhiệm</DetailLabel>
                              <DetailValue>{approval.requestData.reason || 'N/A'}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Ý kiến HR</DetailLabel>
                              <DetailValue>{approval.requestData.hrFeedback || 'N/A'}</DetailValue>
                            </DetailRow>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <DetailRow>
                              <DetailLabel>Tên đăng nhập</DetailLabel>
                              <DetailValue>{approval.requestData.username}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Họ và tên</DetailLabel>
                              <DetailValue>{approval.requestData.fullName}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Email</DetailLabel>
                              <DetailValue>{approval.requestData.email}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Số điện thoại</DetailLabel>
                              <DetailValue>{approval.requestData.phoneNumber}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Chức vụ</DetailLabel>
                              <DetailValue>{approval.requestData.position}</DetailValue>
                            </DetailRow>
                            <DetailRow>
                              <DetailLabel>Lương cơ bản</DetailLabel>
                              <DetailValue>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(approval.requestData.basicSalary)}
                              </DetailValue>
                            </DetailRow>
                          </React.Fragment>
                        )
                      }
                    </DetailTable>
                  </RequestDetails>

                  {approval.status === 'pending' && (
                    <CardActions>
                      <ApproveButton
                        onClick={() => handleApprove(approval)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
                      </ApproveButton>
                      <RejectButton
                        onClick={() => handleReject(approval)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                      </RejectButton>
                    </CardActions>
                  )}
                </CardBody>
              </ApprovalCard>
            ))}
          </ApprovalGrid>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default ApprovalList;