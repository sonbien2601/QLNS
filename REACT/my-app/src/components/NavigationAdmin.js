import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NavigationAdmin = () => {
 const [role, setRole] = useState(null);

 useEffect(() => {
   const storedRole = localStorage.getItem('role');
   setRole(storedRole);
 }, []);

 return (
   <div className="admin-sidebar">
     <ul className="admin-sidebar-menu">
       {/* Menu chung cho cả Admin và HR */}
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

       {/* Menu chỉ dành cho Admin */}
       {role === 'admin' && (
         <li>
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