import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const NavigationAdmin = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Lấy vai trò từ localStorage khi component được render
    const storedRole = localStorage.getItem('role');
    setRole(storedRole); // Lưu vai trò vào state
  }, []);

  return (
    <div className="admin-sidebar"> {/* Đổi tên class thành admin-sidebar */}
      <div className="admin-sidebar-header"> {/* Đổi tên class thành admin-sidebar-header */}
        <h3>Quản lý nhân sự</h3>
      </div>
      <ul className="admin-sidebar-menu"> {/* Đổi tên class thành admin-sidebar-menu */}
        {/* Hiển thị cho tất cả người dùng */}
        {role === 'admin' && (
          <>
            <li>
              <Link to="/admin/overview-admin">
                <i className="fas fa-user-plus"></i> Tổng quan
              </Link>
            </li>
            <li>
              <Link to="/admin/adminProfile">
                <i className="fas fa-user-plus"></i> Quản lý hồ sơ
              </Link>
            </li>
            <li>
              <Link to="/admin/add-employee">
                <i className="fas fa-user-plus"></i> Thêm Nhân Viên
              </Link>
            </li>
            <li>
              <Link to="/admin/contracts">
                <i className="fas fa-user-plus"></i> Quản Lý Hợp Đồng
              </Link>
            </li>
            <li>
              <Link to="/admin/appointment">
                <i className="fas fa-user-plus"></i> Bổ nhiệm
              </Link>
            </li>
            <li>
              <Link to="/admin/dismiss">
                <i className="fas fa-user-minus"></i> Miễn nhiệm
              </Link>
            </li>
            <li>
              <Link to="/admin/resignation-admin">
                <i className="fas fa-sign-out-alt"></i> Nghỉ việc
              </Link>
            </li>
            <li>
              <Link to="/admin/performance">
                <i className="fas fa-chart-line"></i> Vị trí công việc
              </Link>
            </li>
            <li>
              <Link to="/admin/salary">
                <i className="fas fa-dollar-sign"></i> Quản Lý Lương
              </Link>
            </li>
            <li>
              <Link to="/admin/attendance">
                <i className="fas fa-clock"></i> Xem chấm công
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default NavigationAdmin;
