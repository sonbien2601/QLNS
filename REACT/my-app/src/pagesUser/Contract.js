import React, { useState } from 'react';
import NavigationUser from '../components/NavigationUser';
import '../css/style.css';

// Component hiển thị từng dòng thông tin hợp đồng
const ContractRow = ({ contract, onSelect, onContractChange }) => {
  return (
    <tr>
      <td>
        <input 
          type="checkbox" 
          checked={contract.isSelected} 
          onChange={onSelect} 
        />
      </td>
      <td>{contract.employeeName}</td>
      <td>{contract.position}</td>
      <td>
        <input 
          type="text" 
          value={contract.contractType} 
          onChange={(e) => onContractChange(contract.id, 'contractType', e.target.value)} 
          placeholder="Loại hợp đồng"
        />
      </td>
      <td>
        <input 
          type="date" 
          value={contract.startDate} 
          onChange={(e) => onContractChange(contract.id, 'startDate', e.target.value)} 
        />
      </td>
      <td>
        <input 
          type="date" 
          value={contract.endDate} 
          onChange={(e) => onContractChange(contract.id, 'endDate', e.target.value)} 
        />
      </td>
      <td>
        <select 
          value={contract.status} 
          onChange={(e) => onContractChange(contract.id, 'status', e.target.value)}
        >
          <option value="Còn hiệu lực">Còn hiệu lực</option>
          <option value="Hết hiệu lực">Hết hiệu lực</option>
          <option value="Đang chờ duyệt">Đang chờ duyệt</option>
        </select>
      </td>
    </tr>
  );
};

// Component bảng hợp đồng nhân viên
const ContractTable = ({ contracts, onSelect, onContractChange }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Chọn</th>
          <th>Tên Nhân Viên</th>
          <th>Chức Vụ</th>
          <th>Loại Hợp Đồng</th>
          <th>Ngày Bắt Đầu</th>
          <th>Ngày Kết Thúc</th>
          <th>Trạng Thái</th>
        </tr>
      </thead>
      <tbody>
        {contracts.map((contract, index) => (
          <ContractRow 
            key={contract.id} 
            contract={contract} 
            onSelect={() => onSelect(index)} 
            onContractChange={onContractChange} 
          />
        ))}
      </tbody>
    </table>
  );
};

// Component chính: Trang hợp đồng
const Contract = () => {
  const [contracts, setContracts] = useState([
    { id: 1, employeeName: 'Nguyễn Văn A', position: 'Nhân viên IT', contractType: 'Toàn thời gian', startDate: '2022-01-01', endDate: '2025-01-01', status: 'Còn hiệu lực', isSelected: false },
    { id: 2, employeeName: 'Trần Thị B', position: 'Kế Toán', contractType: 'Bán thời gian', startDate: '2023-01-01', endDate: '2024-01-01', status: 'Còn hiệu lực', isSelected: false },
    { id: 3, employeeName: 'Lê Văn C', position: 'Marketing', contractType: 'Thử việc', startDate: '2023-06-01', endDate: '2023-12-01', status: 'Còn hiệu lực', isSelected: false },
    { id: 4, employeeName: 'Phạm Thị D', position: 'Hành Chính', contractType: 'Toàn thời gian', startDate: '2020-03-01', endDate: '2023-03-01', status: 'Hết hiệu lực', isSelected: false },
  ]);

  const handleSelect = (index) => {
    const updatedContracts = [...contracts];
    updatedContracts[index].isSelected = !updatedContracts[index].isSelected;
    setContracts(updatedContracts);
  };

  const handleContractChange = (id, field, value) => {
    const updatedContracts = contracts.map(contract =>
      contract.id === id ? { ...contract, [field]: value } : contract
    );
    setContracts(updatedContracts);
  };

  const handleUpdateContracts = () => {
    const updatedContracts = contracts.filter(contract => contract.isSelected);
    console.log('Cập nhật hợp đồng:', updatedContracts);
    // Thực hiện hành động cập nhật ở đây
  };

  const handleCancelSelected = () => {
    const selectedContracts = contracts.filter(contract => contract.isSelected);
    console.log('Hủy hợp đồng:', selectedContracts);
    // Thực hiện hành động hủy hợp đồng ở đây
  };

  return (
    <div className="main-container">
      <NavigationUser />
      <div className="content">
        <h2>Quản lý Hợp đồng</h2>
        <p>Dưới đây là danh sách hợp đồng của các nhân viên:</p>
        {/* Bảng danh sách hợp đồng */}
        <ContractTable 
          contracts={contracts} 
          onSelect={handleSelect} 
          onContractChange={handleContractChange} 
        />
        <div className="button-container">
          <button className="update-btn" onClick={handleUpdateContracts}>Cập nhật hợp đồng đã chọn</button>
          <button className="cancel-btn" onClick={handleCancelSelected}>Hủy hợp đồng đã chọn</button>
        </div>
      </div>
    </div>
  );
};

export default Contract;
