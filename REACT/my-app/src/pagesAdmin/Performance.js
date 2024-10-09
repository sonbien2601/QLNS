import React, { useState } from 'react';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';

// Component hiển thị từng dòng thông tin hiệu suất
const PerformanceRow = ({ performance, onSelect, onPerformanceChange }) => {
  return (
    <tr>
      <td>
        <input 
          type="checkbox" 
          checked={performance.isSelected} 
          onChange={onSelect} 
        />
      </td>
      <td>{performance.employeeName}</td>
      <td>{performance.position}</td>
      <td>
        <input 
          type="number" 
          value={performance.performanceScore} 
          onChange={(e) => onPerformanceChange(performance.id, 'performanceScore', parseInt(e.target.value) || 0)} 
          placeholder="Điểm hiệu suất"
        />
      </td>
      <td>
        <select 
          value={performance.status} 
          onChange={(e) => onPerformanceChange(performance.id, 'status', e.target.value)}
        >
          <option value="Xuất sắc">Xuất sắc</option>
          <option value="Tốt">Tốt</option>
          <option value="Khá">Khá</option>
          <option value="Yếu">Yếu</option>
        </select>
      </td>
    </tr>
  );
};

// Component bảng hiệu suất
const PerformanceTable = ({ performances, onSelect, onPerformanceChange }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Chọn</th>
          <th>Tên Nhân Viên</th>
          <th>Chức Vụ</th>
          <th>Điểm Hiệu Suất</th>
          <th>Trạng Thái</th>
        </tr>
      </thead>
      <tbody>
        {performances.map((performance, index) => (
          <PerformanceRow 
            key={performance.id} 
            performance={performance} 
            onSelect={() => onSelect(index)} 
            onPerformanceChange={onPerformanceChange} 
          />
        ))}
      </tbody>
    </table>
  );
};

// Component chính: Trang hiệu suất
const Performance = () => {
  const [performances, setPerformances] = useState([
    { id: 1, employeeName: 'Nguyễn Văn A', position: 'Nhân viên IT', performanceScore: 85, status: 'Xuất sắc', isSelected: false },
    { id: 2, employeeName: 'Trần Thị B', position: 'Kế Toán', performanceScore: 78, status: 'Tốt', isSelected: false },
    { id: 3, employeeName: 'Lê Văn C', position: 'Marketing', performanceScore: 90, status: 'Xuất sắc', isSelected: false },
    { id: 4, employeeName: 'Phạm Thị D', position: 'Hành Chính', performanceScore: 65, status: 'Khá', isSelected: false },
  ]);

  const handleSelect = (index) => {
    const updatedPerformances = [...performances];
    updatedPerformances[index].isSelected = !updatedPerformances[index].isSelected;
    setPerformances(updatedPerformances);
  };

  const handlePerformanceChange = (id, field, value) => {
    const updatedPerformances = performances.map(performance =>
      performance.id === id ? { ...performance, [field]: value } : performance
    );
    setPerformances(updatedPerformances);
  };

  const handleUpdateScores = () => {
    const updatedPerformances = performances.filter(performance => performance.isSelected);
    console.log('Cập nhật thông tin hiệu suất:', updatedPerformances);
    // Thực hiện hành động cập nhật ở đây
  };

  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Quản lý Hiệu suất</h2>
        <p>Dưới đây là danh sách hiệu suất làm việc của các nhân viên:</p>
        <PerformanceTable 
          performances={performances} 
          onSelect={handleSelect} 
          onPerformanceChange={handlePerformanceChange} 
        />
        <button className="update-btn" onClick={handleUpdateScores}>Cập nhật thông tin hiệu suất đã chọn</button>
      </div>
    </div>
  );
};

export default Performance;
