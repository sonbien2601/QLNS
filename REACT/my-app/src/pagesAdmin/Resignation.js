import React, { useState } from 'react';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';

// Component hiển thị từng dòng nhân viên nghỉ việc
const ResignationRow = ({ name, position, status }) => {
  return (
    <tr>
      <td>{name}</td>
      <td>{position}</td>
      <td>{status}</td>
      <td>
        <button className="view-btn">Xem chi tiết</button>
        <button className="approve-btn">Phê duyệt</button>
        <button className="reject-btn">Từ chối</button>
      </td>
    </tr>
  );
};

// Component bảng danh sách nhân viên nghỉ việc
const ResignationTable = ({ resignations }) => {
  return (
    <table className="applicant-table">
      <thead>
        <tr>
          <th>Tên Nhân Viên</th>
          <th>Vị Trí Công Việc</th>
          <th>Trạng Thái</th>
          <th>Hành Động</th>
        </tr>
      </thead>
      <tbody>
        {resignations.map((resignation) => (
          <ResignationRow 
            key={resignation.id} 
            name={resignation.name} 
            position={resignation.position} 
            status={resignation.status} 
          />
        ))}
      </tbody>
    </table>
  );
};

// Component chính: Trang nghỉ việc
const Resignation = () => {
  // Dữ liệu tĩnh, bạn có thể thay thế bằng dữ liệu động sau này
  const [resignations, setResignations] = useState([
    { id: 1, name: 'Nguyễn Văn A', position: 'Nhân viên IT', status: 'Đang chờ duyệt' },
    { id: 2, name: 'Trần Thị B', position: 'Nhân viên Kế Toán', status: 'Đã phê duyệt' },
    { id: 3, name: 'Lê Văn C', position: 'Nhân viên Marketing', status: 'Đang chờ duyệt' },
    { id: 4, name: 'Phạm Thị D', position: 'Nhân viên Hành Chính', status: 'Bị từ chối' },
  ]);

  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Quản lý Nghỉ việc</h2>
        <p>Dưới đây là danh sách các nhân viên đã nộp đơn xin nghỉ việc:</p>
        {/* Bảng danh sách nhân viên nghỉ việc */}
        <ResignationTable resignations={resignations} />
      </div>
    </div>
  );
};

export default Resignation;
