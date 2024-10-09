import React, { useState } from 'react';
import NavigationAdmin from '../components/NavigationAdmin'; // Import Navigation
import '../css/style.css';

// Component hiển thị từng dòng thông tin nhân viên
const DismissalRow = ({ employee, isSelected, onSelect, onReasonChange, onStatusChange }) => {
  return (
    <tr>
      <td>
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={onSelect} 
        />
      </td>
      <td>{employee.name}</td>
      <td>{employee.position}</td>
      <td>
        <input 
          type="text" 
          value={employee.reason} 
          onChange={(e) => onReasonChange(employee.id, e.target.value)} 
          placeholder="Nhập lý do miễn nhiệm"
        />
      </td>
      <td>
        <select 
          value={employee.status} 
          onChange={(e) => onStatusChange(employee.id, e.target.value)}
        >
          <option value="Đang chờ duyệt">Đang chờ duyệt</option>
          <option value="Đã phê duyệt">Đã phê duyệt</option>
          <option value="Bị từ chối">Bị từ chối</option>
        </select>
      </td>
    </tr>
  );
};

// Component bảng nhân viên miễn nhiệm
const DismissalTable = ({ employees, onSelect, onReasonChange, onStatusChange }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Chọn</th>
          <th>Tên Nhân Viên</th>
          <th>Chức Vụ</th>
          <th>Lý Do Miễn Nhiệm</th>
          <th>Trạng Thái</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee, index) => (
          <DismissalRow 
            key={employee.id} 
            employee={employee} 
            isSelected={employee.isSelected} 
            onSelect={() => onSelect(index)} 
            onReasonChange={onReasonChange} 
            onStatusChange={onStatusChange} 
          />
        ))}
      </tbody>
    </table>
  );
};

// Component chính: Trang miễn nhiệm
const Dismissal = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Nguyễn Văn A', position: 'Nhân viên IT', reason: '', status: 'Đang chờ duyệt', isSelected: false },
    { id: 2, name: 'Trần Thị B', position: 'Kế Toán', reason: '', status: 'Đã phê duyệt', isSelected: false },
    { id: 3, name: 'Lê Văn C', position: 'Marketing', reason: '', status: 'Đang chờ duyệt', isSelected: false },
    { id: 4, name: 'Phạm Thị D', position: 'Hành Chính', reason: '', status: 'Bị từ chối', isSelected: false },
  ]);

  const handleSelect = (index) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index].isSelected = !updatedEmployees[index].isSelected;
    setEmployees(updatedEmployees);
  };

  const handleReasonChange = (id, newReason) => {
    const updatedEmployees = employees.map(employee =>
      employee.id === id ? { ...employee, reason: newReason } : employee
    );
    setEmployees(updatedEmployees);
  };

  const handleStatusChange = (id, newStatus) => {
    const updatedEmployees = employees.map(employee =>
      employee.id === id ? { ...employee, status: newStatus } : employee
    );
    setEmployees(updatedEmployees);
  };

  const handleDismissSelected = () => {
    const selectedEmployees = employees.filter(employee => employee.isSelected);
    console.log('Nhân viên được miễn nhiệm:', selectedEmployees);
    // Thực hiện hành động miễn nhiệm ở đây
  };

  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Quản lý Miễn nhiệm</h2>
        <p>Dưới đây là danh sách nhân viên:</p>
        {/* Bảng danh sách nhân viên */}
        <DismissalTable 
          employees={employees} 
          onSelect={handleSelect} 
          onReasonChange={handleReasonChange} 
          onStatusChange={handleStatusChange} 
        />
        <button className="dismiss-btn" onClick={handleDismissSelected}>Miễn nhiệm đã chọn</button>
      </div>
    </div>
  );
};

export default Dismissal;
