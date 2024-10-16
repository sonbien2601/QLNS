import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HeaderAdmin from './components/HeaderAdmin';
import HeaderUser from './components/HeaderUser';
import Login from './pages/Login';
import Register from './pages/Register';
import Introduce from './pages/Introduce';
import PublicRoute from './pages/PublicRoute';
import ProtectedRoute from './pages/ProtectedRoute';

// Admin Pages
import Admin from './pagesAdmin/Admin';
import Performance from './pagesAdmin/Performance';
import AppointmentAdmin from './pagesAdmin/AppointmentAdmin';
import Resignation from './pagesAdmin/Resignation';
import Dismissal from './pagesAdmin/Dismissal';
import AddEmployee from './pagesAdmin/AddEmployee';
import AddtendanceAdmin from './pagesAdmin/AddtendanceAdmin';
import SalaryAdmin from './pagesAdmin/SalaryAdmin';
import ContractAdmin from './pagesAdmin/ContractAdmin';
import AdminProfileManagement from './pagesAdmin/AdminProfileManagement';
import OverviewAdmin from './pagesAdmin/OverviewAdmin';
import ResignationAdmin from './pagesAdmin/ResignationAdmin';

// User Pages
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
      <Routes>
        {/* Login route without header */}
        <Route path="/login" element={<Login />} />

        {/* All other routes with header */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              {role === 'admin' && <HeaderAdmin />}
              {role === 'user' && <HeaderUser />}
              <Routes>
                {/* Public routes */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <Introduce />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/introduce"
                  element={
                    <PublicRoute>
                      <Introduce />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Protected routes for admin */}
                <Route
                  path="/admin"
                  element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>}
                >
                  <Route index element={<Navigate to="overview-admin" replace />} />
                  <Route path="overview-admin" element={<OverviewAdmin />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="appointment" element={<AppointmentAdmin />} />
                  <Route path="resign" element={<Resignation />} />
                  <Route path="dismiss" element={<Dismissal />} />
                  <Route path="add-employee" element={<AddEmployee />} />
                  <Route path="attendance" element={<AddtendanceAdmin />} />
                  <Route path="salary" element={<SalaryAdmin />} />
                  <Route path="contracts" element={<ContractAdmin />} />
                  <Route path="adminProfile" element={<AdminProfileManagement />} />
                  <Route path="resignation-admin" element={<ResignationAdmin />} />
                </Route>

                {/* Protected routes for user */}
                <Route
                  path="/user"
                  element={<ProtectedRoute roles={['user']}><User /></ProtectedRoute>}
                >
                  <Route index element={<Navigate to="overview-user" replace />} />
                  <Route path="overview-user" element={<OverviewUser />} />
                  <Route path="view-contractuser" element={<ContractUser />} />
                  <Route path="appointment" element={<AppointmentUser />} />
                  <Route path="attendance" element={<AttendanceUser />} />
                  <Route path="salary" element={<SalaryUser />} />
                  <Route path="resignation-user" element={<ResignationUser />} />
                </Route>

                {/* Redirect to home if no route matches */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;