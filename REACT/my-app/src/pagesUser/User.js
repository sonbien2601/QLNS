import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import HeaderUser from '../components/HeaderUser';
import NavigationUser from '../components/NavigationUser';

// Styled Components
const UserContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const UserContent = styled.div`
  display: flex;
  flex: 1;
  background-color: #f4f7f9;
`;

const SidebarWrapper = styled.div`
  width: 250px;
  background-color: #1a2035;
  min-height: calc(100vh - 64px); // Trừ đi chiều cao của header
  position: fixed;
  left: 0;
  top: 64px; // Chiều cao của header
`;

const MainContentWrapper = styled.div`
  flex: 1;
  margin-left: 250px; // Chiều rộng của sidebar
  padding: 20px;
  min-height: calc(100vh - 64px); // Trừ đi chiều cao của header
  overflow-x: auto;
  padding-top: 84px; // Thêm khoảng cách phía trên để tránh bị che bởi header
`;

const HeaderWrapper = styled.div`
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const User = () => {
  return (
    <UserContainer>
      <HeaderWrapper>
        <HeaderUser />
      </HeaderWrapper>
      
      <UserContent>
        <SidebarWrapper>
          <NavigationUser />
        </SidebarWrapper>
        
        <MainContentWrapper>
          <Outlet />
        </MainContentWrapper>
      </UserContent>
    </UserContainer>
  );
};

export default User;