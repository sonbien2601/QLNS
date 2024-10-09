import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, roles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Kiểm tra xem có token không và vai trò có khớp với role yêu cầu không
  if (!token || !roles.includes(role)) {
    // Nếu không có token hoặc không có quyền, điều hướng đến trang đăng nhập
    return <Navigate to="/login" />;
  }

  // Nếu người dùng có quyền, render component mong muốn
  return element;
};

export default PrivateRoute;
