// ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ roles, children }) => {
  // Lấy vai trò người dùng từ localStorage
  const userRole = localStorage.getItem('role');

  // Nếu người dùng không có vai trò hoặc vai trò không nằm trong danh sách roles, chuyển hướng đến trang đăng nhập
  if (!userRole || !roles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  // Nếu vai trò của người dùng khớp, hiển thị nội dung bên trong route được bảo vệ
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
