import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import '../css/style.css';
import HeaderUser from '../components/HeaderUser';
import NavigationUser from '../components/NavigationUser';

const User = () => {
  return (
    <div>
      <HeaderUser /> {/* Hiển thị header */}
      <div className="user-layout">
        <NavigationUser /> {/* Hiển thị navigation */}
        <div className="user-content">
          <Outlet /> {/* Nội dung sẽ được hiển thị ở đây */}
        </div>
      </div>
    </div>
  );
};

export default User;
