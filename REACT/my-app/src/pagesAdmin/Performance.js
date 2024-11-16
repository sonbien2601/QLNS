import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCog, FaSync } from 'react-icons/fa';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';


// Styled Components
const Container = styled.div`
  padding: 20px;
  background: white;
  margin: 80px 20px 20px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    font-size: 24px;
    color: #333;
  }

  .header-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 300px;
  position: relative;
  display: flex;
  align-items: center;

  input {
    width: 100%;
    padding: 8px 12px;
    padding-left: 36px;  // Để trống cho icon
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 14px;
  padding-bottom: 12px
`;

const Filters = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    min-width: 150px;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const IconButton = styled.button`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    font-size: 16px;
    color: #666;
  }

  &:hover {
    background: #f5f5f5;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  tr:hover {
    background-color: #f8f9fa;
  }

  td.status {
    color: #28a745;
  }

  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'Đang làm việc':
        return 'background-color: #e6f4ea; color: #1e7e34;';
      case 'Đã nghỉ việc':
        return 'background-color: #feeced; color: #dc3545;';
      default:
        return 'background-color: #f8f9fa; color: #6c757d;';
    }
  }}
`;

const Performance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Danh sách trạng thái và loại nhân viên từ enum trong User2
  const statusOptions = ['active', 'inactive'];
  const employeeTypeOptions = ['Thử việc', 'Chính thức'];

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/performance/search', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          search: searchTerm,
          status: statusFilter === 'Tất cả' ? '' : statusFilter,
          employeeType: typeFilter === 'Tất cả' ? '' : typeFilter
        }
      });

      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(salary);
  };

  const getStatusDisplay = (status) => {
    return status === 'active' ? 'Đang làm việc' : 'Đã nghỉ việc';
  };

  return (
    <Container>
      <Header>
        <h2>Quản lý nhân viên</h2>
        <div className="header-right">
          <IconButton onClick={() => fetchEmployees()}>
            <FaSync />
          </IconButton>
          <IconButton>
            <FaCog />
          </IconButton>
        </div>
      </Header>

      <Controls>
        <SearchBox>
          <SearchIcon />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc chức vụ"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <Filters>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {getStatusDisplay(status)}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả loại</option>
            {employeeTypeOptions.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Filters>
      </Controls>

      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div>Lỗi: {error}</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Chức vụ</th>
              <th>Mức lương</th>
              <th>Loại nhân viên</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              employees.map(employee => (
                <tr key={employee._id}>
                  <td>{employee.fullName}</td>
                  <td>{employee.position}</td>
                  <td>{formatSalary(employee.basicSalary)}</td>
                  <td>{employee.employeeType}</td>
                  <td>
                    <StatusBadge status={getStatusDisplay(employee.status)}>
                      {getStatusDisplay(employee.status)}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Performance;