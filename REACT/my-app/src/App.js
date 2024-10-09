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
import Appointment from './pagesAdmin/Appointment';
import Resignation from './pagesAdmin/Resignation';
import Dismissal from './pagesAdmin/Dismissal';
import AddEmployee from './pagesAdmin/AddEmployee';
import AttendanceAdmin from './pagesAdmin/AddtendanceAdmin'; 
import SalaryAdmin from './pagesAdmin/SalaryAdmin';

// User
import Contract from './pagesUser/Contract';
import Profile from './pagesUser/Profile';
import Overview from './pagesUser/Overview';
import PrivateRoute from './components/PrivateRoute';  
import User from './pagesUser/User';
import AppointmentUser from './pagesUser/AppointmentUser';
import AttendanceUser from './pagesUser/AttendanceUser';
import SalaryUser from './pagesUser/SalaryUser';

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
          <Route path="appointment" element={<Appointment />} />
          <Route path="resign" element={<Resignation />} />
          <Route path="dismiss" element={<Dismissal />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="attendance" element={<AttendanceAdmin />} /> {/* Thêm route AttendanceAdmin */}
          <Route path="/admin/salary" element={<SalaryAdmin />} />
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
          <Route path="view-contracts" element={<Contract />} />
          <Route path="view-overview" element={<Overview />} />
          <Route path="edit-profile" element={<Profile />} />
          <Route path="appointment" element={<AppointmentUser />} />
          <Route path="attendance" element={<AttendanceUser />} /> {/* Thêm route AttendanceUser */}
          <Route path="/user/salary" element={<SalaryUser />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
