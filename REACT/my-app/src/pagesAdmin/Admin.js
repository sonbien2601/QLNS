import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import '../css/style.css';
import HeaderAdmin from '../components/HeaderAdmin';
import NavigationAdmin from '../components/NavigationAdmin';

const Admin = () => {
  return (
    <div>
      <HeaderAdmin /> {/* Hiển thị header */}
      <div className="admin-layout">
        <NavigationAdmin /> {/* Hiển thị navigation */}
        <div className="admin-content">
          <Outlet /> {/* Nội dung sẽ được hiển thị ở đây */}
        </div>
      </div>
    </div>
  );
};

export default Admin;
