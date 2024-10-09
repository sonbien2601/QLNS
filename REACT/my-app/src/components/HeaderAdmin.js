import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const HeaderAdmin = () => {
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem('fullName');
    setFullName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    navigate('/login');
    window.location.reload();
  };

  return (
    <header>
      <h1>Admin Panel</h1>
      <nav>
        <ul>
          <li><Link to="/admin">Dashboard</Link></li>
        </ul>
      </nav>
      <div className="header-right">
        {fullName && <div className="welcome-message">Hello, {fullName}</div>}
        <button className="logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default HeaderAdmin;