import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/app/Dashboard';
import Employees from './pages/app/Employees';
import Org from './pages/app/Org';
import Contracts from './pages/app/Contracts';
import Attendance from './pages/app/Attendance';
import Leave from './pages/app/Leave';
import Overtime from './pages/app/Overtime';
import Payroll from './pages/app/Payroll';
import { Appointments, Dismissals, Resignations } from './pages/app/Workforce';
import Approvals from './pages/app/Approvals';
import Tasks from './pages/app/Tasks';
import Profile from './pages/app/Profile';

const theme = {
  token: {
    colorPrimary: '#0F766E',
    borderRadius: 8,
    fontFamily: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
    colorBgLayout: '#F3F6F9',
  },
};

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spin />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
              <Route path="/app" element={<Guard><AppLayout /></Guard>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="employees" element={<Guard roles={['admin', 'hr', 'finance']}><Employees /></Guard>} />
                <Route path="org" element={<Guard roles={['admin', 'hr']}><Org /></Guard>} />
                <Route path="contracts" element={<Contracts />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="leave" element={<Guard roles={['admin', 'hr', 'employee']}><Leave /></Guard>} />
                <Route path="overtime" element={<Overtime />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="appointments" element={<Guard roles={['admin', 'hr']}><Appointments /></Guard>} />
                <Route path="dismissals" element={<Guard roles={['admin', 'hr']}><Dismissals /></Guard>} />
                <Route path="resignations" element={<Resignations />} />
                <Route path="approvals" element={<Guard roles={['admin', 'hr']}><Approvals /></Guard>} />
                <Route path="tasks" element={<Guard roles={['admin', 'hr', 'employee']}><Tasks /></Guard>} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
