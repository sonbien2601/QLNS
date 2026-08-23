import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../theme/format';

const { Header, Sider, Content } = Layout;

const MENU = [
  { key: '/app/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan', roles: ['admin', 'hr', 'finance', 'employee'] },
  { key: '/app/employees', icon: <TeamOutlined />, label: 'Nhân sự', roles: ['admin', 'hr', 'finance'] },
  { key: '/app/org', icon: <ApartmentOutlined />, label: 'Tổ chức', roles: ['admin', 'hr'] },
  { key: '/app/contracts', icon: <FileProtectOutlined />, label: 'Hợp đồng', roles: ['admin', 'hr', 'employee'] },
  { key: '/app/attendance', icon: <ClockCircleOutlined />, label: 'Chấm công', roles: ['admin', 'hr', 'finance', 'employee'] },
  { key: '/app/leave', icon: <CalendarOutlined />, label: 'Nghỉ phép', roles: ['admin', 'hr', 'employee'] },
  { key: '/app/overtime', icon: <FieldTimeOutlined />, label: 'Tăng ca', roles: ['admin', 'hr', 'finance', 'employee'] },
  { key: '/app/payroll', icon: <DollarOutlined />, label: 'Bảng lương', roles: ['admin', 'hr', 'finance', 'employee'] },
  { key: '/app/appointments', icon: <RiseOutlined />, label: 'Bổ nhiệm', roles: ['admin', 'hr'] },
  { key: '/app/dismissals', icon: <FallOutlined />, label: 'Điều chuyển', roles: ['admin', 'hr'] },
  { key: '/app/resignations', icon: <LogoutOutlined />, label: 'Nghỉ việc', roles: ['admin', 'hr', 'employee'] },
  { key: '/app/approvals', icon: <CheckCircleOutlined />, label: 'Phê duyệt', roles: ['admin', 'hr'] },
  { key: '/app/tasks', icon: <UnorderedListOutlined />, label: 'Công việc', roles: ['admin', 'hr', 'employee'] },
  { key: '/app/profile', icon: <ProfileOutlined />, label: 'Hồ sơ', roles: ['admin', 'hr', 'finance', 'employee'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const { token } = theme.useToken();

  const items = MENU.filter((m) => m.roles.includes(user?.role)).map(({ key, icon, label }) => ({
    key, icon, label,
  }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={72}
        width={248}
        style={{
          background: '#0B1220',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '22px 20px 16px', color: '#fff' }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: '#94A3B8' }}>QLNS</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>People Ops</div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[loc.pathname]}
          items={items}
          onClick={({ key }) => nav(key)}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Typography.Text type="secondary">
            Hệ thống nhân sự · BLLĐ 2019 · BHXH/TNCN 2026
          </Typography.Text>
          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: 'Hồ sơ', onClick: () => nav('/app/profile') },
                { key: 'out', label: 'Đăng xuất', danger: true, onClick: () => { logout(); nav('/login'); } },
              ],
            }}
          >
            <Button type="text" style={{ height: 48 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: token.colorPrimary, marginRight: 8 }} />
              <span style={{ fontWeight: 600 }}>{user?.fullName}</span>
              <span style={{ color: '#64748B', marginLeft: 8 }}>{ROLE_LABEL[user?.role]}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: '#F3F6F9' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
