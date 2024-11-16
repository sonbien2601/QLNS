import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavigationAdmin = () => {
  const [role, setRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  return (
    <div className="admin-sidebar">
      <ul className="admin-sidebar-menu">
        {/* Menu chung cho cả Admin và HR */}
        <li className={location.pathname === '/admin/overview-admin' ? 'active' : ''}>
          <Link to="/admin/overview-admin">
            <i className="fas fa-user-plus"></i> Tổng quan
          </Link>
        </li>
        <li className={location.pathname === '/admin/adminProfile' ? 'active' : ''}>
          <Link to="/admin/adminProfile">
            <i className="fas fa-user-plus"></i> Quản lý hồ sơ
          </Link>
        </li>
        <li className={location.pathname === '/admin/add-employee' ? 'active' : ''}>
          <Link to="/admin/add-employee">
            <i className="fas fa-user-plus"></i> Thêm Nhân Viên
          </Link>
        </li>
        <li className={location.pathname === '/admin/contracts' ? 'active' : ''}>
          <Link to="/admin/contracts">
            <i className="fas fa-user-plus"></i> Quản Lý Hợp Đồng
          </Link>
        </li>
        <li className={location.pathname === '/admin/appointment' ? 'active' : ''}>
          <Link to="/admin/appointment">
            <i className="fas fa-user-plus"></i> Bổ nhiệm
          </Link>
        </li>
        <li className={location.pathname === '/admin/dismiss' ? 'active' : ''}>
          <Link to="/admin/dismiss">
            <i className="fas fa-user-minus"></i> Miễn nhiệm
          </Link>
        </li>
        {/* Menu nghỉ việc - phân biệt theo role */}
        {role === 'admin' ? (
          <li className={location.pathname === '/admin/resignation-admin' ? 'active' : ''}>
            <Link to="/admin/resignation-admin">
              <i className="fas fa-sign-out-alt"></i> Quản lý nghỉ việc
            </Link>
          </li>
        ) : role === 'hr' && (
          <li className={location.pathname === '/admin/hr-resignation' ? 'active' : ''}>
            <Link to="/admin/hr-resignation">
              <i className="fas fa-clock"></i> Nghỉ phép/Nghỉ việc
            </Link>
          </li>
        )}
        <li className={location.pathname === '/admin/performance' ? 'active' : ''}>
          <Link to="/admin/performance">
            <i className="fas fa-chart-line"></i> Vị trí công việc
          </Link>
        </li>
        <li className={location.pathname === '/admin/salary' ? 'active' : ''}>
          <Link to="/admin/salary">
            <i className="fas fa-dollar-sign"></i> Quản Lý Lương
          </Link>
        </li>
        <li className={location.pathname === '/admin/attendance' ? 'active' : ''}>
          <Link to="/admin/attendance">
            <i className="fas fa-clock"></i> Xem chấm công
          </Link>
        </li>


        {/* Menu chỉ dành cho Admin */}
        {role === 'admin' && (
          <li className={location.pathname === '/admin/approval-list' ? 'active' : ''}>
            <Link to="/admin/approval-list">
              <i className="fas fa-check-circle"></i> Phê duyệt thao tác
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default NavigationAdmin;