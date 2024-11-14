import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #1a237e;
  margin: 0;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  select, input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #1a237e;
      box-shadow: 0 0 0 2px rgba(26,35,126,0.2);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.secondary ? '#e0e0e0' : '#1a237e'};
  color: ${props => props.secondary ? '#333' : 'white'};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.secondary ? '#d5d5d5' : '#0d1b60'};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 2rem;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tr:hover td {
    background: #f8f9fa;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'pending':
        return '#FEF3C7';
      case 'waiting_admin':
        return '#E0F2FE';  // Light blue for waiting admin
      case 'approved':
        return '#D1FAE5';
      case 'rejected':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'pending':
        return '#92400E';
      case 'waiting_admin':
        return '#0369A1';  // Dark blue for waiting admin
      case 'approved':
        return '#065F46';
      case 'rejected':
        return '#991B1B';
      default:
        return '#374151';
    }
  }};
`;

const DismissalList = () => {
  const [users, setUsers] = useState([]);
  const [dismissalHistory, setDismissalHistory] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    newPosition: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchUsers();
    fetchDismissalHistory();
    // Lấy role từ local storage hoặc decode từ token
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decodedToken.role);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách nhân viên'
      });
    }
  };

  const fetchDismissalHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/dismissals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDismissalHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải lịch sử miễn nhiệm'
      });
    }
  };

  // Thêm hàm format trạng thái
const formatStatus = (status) => {
  switch (status) {
    case 'pending': return 'Chờ phê duyệt';
    case 'waiting_admin': return 'Chờ Admin phê duyệt';
    case 'approved': return 'Đã phê duyệt';
    case 'rejected': return 'Đã từ chối';
    default: return status;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.userId || !formData.newPosition || !formData.reason || !formData.effectiveDate) {
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng điền đầy đủ thông tin'
      });
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const selectedUser = users.find(user => user._id === formData.userId);
  
      // Validate vị trí mới phải khác vị trí hiện tại
      if (selectedUser?.position === formData.newPosition) {
        MySwal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vị trí mới phải khác vị trí hiện tại'
        });
        return;
      }
  
      const result = await MySwal.fire({
        title: 'Xác nhận miễn nhiệm',
        html: `
          <div style="text-align: left">
            <p><strong>Nhân viên:</strong> ${selectedUser?.fullName}</p>
            <p><strong>Chức vụ hiện tại:</strong> ${selectedUser?.position}</p>
            <p><strong>Chức vụ mới:</strong> ${formData.newPosition}</p>
            <p><strong>Lý do:</strong> ${formData.reason}</p>
            <p><strong>Ngày hiệu lực:</strong> ${new Date(formData.effectiveDate).toLocaleDateString('vi-VN')}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        reverseButtons: true
      });
  
      if (result.isConfirmed) {
        const requestData = {
          ...formData,
          oldPosition: selectedUser.position,
        };
  
        const response = await axios.post(
          'http://localhost:5000/api/auth/dismissals',
          requestData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
  
        // Xử lý phản hồi khác nhau cho HR và Admin
        if (userRole === 'hr') {
          if (response.data.approvalId) {
            await MySwal.fire({
              icon: 'success',
              title: 'Đã gửi yêu cầu',
              text: 'Yêu cầu miễn nhiệm đã được gửi đến Admin để phê duyệt',
              timer: 2000
            });
          } else {
            throw new Error('Không nhận được ID phê duyệt');
          }
        } else {
          // Xử lý cho Admin
          await MySwal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã miễn nhiệm thành công',
            timer: 1500
          });
        }
  
        // Reset form và refresh data
        setFormData({
          userId: '',
          newPosition: '',
          reason: '',
          effectiveDate: new Date().toISOString().split('T')[0]
        });
  
        // Refresh danh sách
        await Promise.all([
          fetchUsers(),
          fetchDismissalHistory()
        ]);
  
      }
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'Không thể thực hiện miễn nhiệm';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      MySwal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: errorMessage
      });
    }
  };

  return (
    <Container>
      <Header>
        <Title>Miễn nhiệm / Giáng chức</Title>
        <div className="text-sm text-gray-500">
          {userRole === 'hr' ? 
            '(Yêu cầu sẽ được gửi đến Admin để phê duyệt)' : 
            '(Miễn nhiệm sẽ được thực hiện ngay lập tức)'}
        </div>
      </Header>
  
      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Chọn nhân viên:</label>
            <select
              value={formData.userId}
              onChange={e => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">-- Chọn nhân viên --</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.fullName} - {user.position}
                </option>
              ))}
            </select>
          </FormGroup>
  
          <FormGroup>
            <label>Chức vụ mới:</label>
            <input
              type="text"
              value={formData.newPosition}
              onChange={e => setFormData({ ...formData, newPosition: e.target.value })}
              required
              placeholder="Nhập chức vụ mới"
            />
          </FormGroup>
  
          <FormGroup style={{ gridColumn: '1 / -1' }}>
            <label>Lý do:</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              required
              placeholder="Nhập lý do miễn nhiệm"
            />
          </FormGroup>
  
          <FormGroup>
            <label>Ngày hiệu lực:</label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </FormGroup>
  
          <Button 
            type="submit" 
            style={{ gridColumn: '1 / -1' }}
            title={userRole === 'hr' ? 'Gửi yêu cầu miễn nhiệm để Admin phê duyệt' : 'Thực hiện miễn nhiệm trực tiếp'}
          >
            <FileText size={20} />
            {userRole === 'hr' ? 'Gửi yêu cầu miễn nhiệm' : 'Thực hiện miễn nhiệm'}
          </Button>
        </Form>
      </Card>
  
      <Card>
        <Header style={{ marginBottom: '1rem' }}>
          <h2>Lịch sử miễn nhiệm</h2>
        </Header>
        <HistoryTable>
  <thead>
    <tr>
      <th>Nhân viên</th>
      <th>Chức vụ cũ</th>
      <th>Chức vụ mới</th>
      <th>Lý do</th>
      <th>Ngày hiệu lực</th>
      <th>Trạng thái</th>
      {userRole === 'hr' && <th>Phản hồi Admin</th>}
      <th>Người tạo</th>
      <th>Ngày tạo</th>
    </tr>
  </thead>
  <tbody>
    {dismissalHistory.map((item, index) => (
      <tr key={index}>
        <td>{item.userId?.fullName}</td>
        <td>{item.oldPosition}</td>
        <td>{item.newPosition}</td>
        <td>{item.reason}</td>
        <td>{new Date(item.effectiveDate).toLocaleDateString('vi-VN')}</td>
        <td>
          <StatusBadge status={item.status}>
            {formatStatus(item.status)}
          </StatusBadge>
        </td>
        {userRole === 'hr' && (
          <td>{item.adminResponse || '-'}</td>
        )}
        <td>{item.createdBy?.fullName || 'N/A'}</td>
        <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
      </tr>
    ))}
    {dismissalHistory.length === 0 && (
      <tr>
        <td colSpan={userRole === 'hr' ? 9 : 8} style={{ textAlign: 'center', padding: '2rem' }}>
          Chưa có lịch sử miễn nhiệm
        </td>
      </tr>
    )}
  </tbody>
</HistoryTable>
      </Card>
    </Container>
  );
};

export default DismissalList;