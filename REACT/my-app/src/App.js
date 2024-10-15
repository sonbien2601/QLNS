// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HeaderAdmin from './components/HeaderAdmin';
import HeaderUser from './components/HeaderUser';
import Admin from './pagesAdmin/Admin';  
import Login from './pages/Login';  
import Register from './pages/Register';  
import Introduce from './pages/Introduce';

// Admin
import Performance from './pagesAdmin/Performance';
import AppointmentAdmin from './pagesAdmin/AppointmentAdmin';
import Resignation from './pagesAdmin/Resignation';
import Dismissal from './pagesAdmin/Dismissal';
import AddEmployee from './pagesAdmin/AddEmployee';
import AttendanceAdmin from './pagesAdmin/AddtendanceAdmin'; 
import SalaryAdmin from './pagesAdmin/SalaryAdmin';
import ContractAdmin from './pagesAdmin/ContractAdmin';
import AdminProfileManagement from './pagesAdmin/AdminProfileManagement';
import OverviewAdmin from './pagesAdmin/OverviewAdmin';
import ResignationAdmin from './pagesAdmin/ResignationAdmin';


// User
import PrivateRoute from './components/PrivateRoute';  
import User from './pagesUser/User';
import AppointmentUser from './pagesUser/AppointmentUser';
import AttendanceUser from './pagesUser/AttendanceUser';
import SalaryUser from './pagesUser/SalaryUser';
import ContractUser from './pagesUser/ContractUser';
import OverviewUser from './pagesUser/OverviewUser';
import ResignationUser from './pagesUser/ResignationUser';


function App() {
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Header />
      {role === 'admin' && <HeaderAdmin />}
      {role === 'user' && <HeaderUser />}

      <Routes>
        <Route path="/" element={<Introduce />} />
        <Route path="/introduce" element={<Introduce />} />
        <Route path="/login" element={<Login />} />  
        <Route path="/register" element={<Register />} />
        {/* Route cho admin */}
        <Route path="/admin" element={<PrivateRoute element={<Admin />} roles={['admin']} />}>
          {/* Nội dung mặc định khi vào /admin */}
          <Route
            index
            element={
              <div>
                <h2>Quản lý nhân sự</h2>
                <p>Chào mừng bạn đến với trang quản trị! Tại đây, bạn có thể quản lý và theo dõi các thông tin quan trọng liên quan đến nhân viên của tổ chức.</p>
                <p>Vui lòng sử dụng menu bên trái để truy cập các chức năng như bổ nhiệm, miễn nhiệm, nghỉ việc, hiệu suất, và tuyển dụng.</p>
              </div>
            }
          />
          <Route path="performance" element={<Performance />} />
          <Route path="appointment" element={<AppointmentAdmin />} />
          <Route path="resign" element={<Resignation />} />
          <Route path="dismiss" element={<Dismissal />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="attendance" element={<AttendanceAdmin />} /> 
          <Route path="/admin/salary" element={<SalaryAdmin />} />
          <Route path="/admin/contracts" element={<ContractAdmin />} />
          <Route path="/admin/adminProfile" element={<AdminProfileManagement />} />
          <Route path="/admin/overview-admin" element={<OverviewAdmin />} />
          <Route path="/admin/resignation-admin" element={<ResignationAdmin />} />
        </Route>

        {/* Route cho user */}
        <Route path="/user" element={<PrivateRoute element={<User />} roles={['user']} />}>
          <Route
            index
            element={
              <div>
                <h2>Thông tin nhân viên</h2>
                <p>Chào mừng bạn đến với trang thông tin nhân viên! Tại đây, bạn có thể quản lý và theo dõi các thông tin quan trọng liên quan đến nhân viên của tổ chức.</p>
                <p>Vui lòng sử dụng menu bên trái để truy cập các chức năng như lương, tổng quan, hồ sơ, hợp đồng.</p>
              </div>
            }
          />
          <Route path="view-contractuser" element={<ContractUser />} />
          <Route path="appointment" element={<AppointmentUser />} />
          <Route path="attendance" element={<AttendanceUser />} /> {/* Thêm route AttendanceUser */}
          <Route path="/user/salary" element={<SalaryUser />} />
          <Route path="/user/overview-user" element={<OverviewUser />} />
          <Route path="/user/resignation-user" element={<ResignationUser />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
