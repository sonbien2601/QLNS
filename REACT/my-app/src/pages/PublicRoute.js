// PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  
  // Nếu người dùng đã đăng nhập, chuyển hướng họ đến trang tương ứng
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (role === 'user') {
    return <Navigate to="/user" replace />;
  }

  // Nếu chưa đăng nhập, tiếp tục hiển thị trang công khai
  return children ? children : <Outlet />;
};

export default PublicRoute;
