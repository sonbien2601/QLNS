import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import logo from "../images/logoQLNS2.jpg"; // Đường dẫn đến logo của bạn

const HeaderAdmin = () => {
  const [fullName, setFullName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("fullName");
    setFullName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/login");
    window.location.reload();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <nav className="nav-container">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
      </nav>
      <div className="header-right">
        {fullName && <div className="welcome-message">Hello, {fullName}</div>}
        <button className="user-icon" onClick={toggleMenu}>
          <FontAwesomeIcon icon={faUser} />
        </button>
        {isMenuOpen && (
          <div className="logout-confirm">
            <p>Bạn có muốn đăng xuất không?</p>
            <div className="confirm-buttons">
              <button className="confirm-logout-button" onClick={handleLogout}>
                Có
              </button>
              <button className="cancel-button" onClick={closeMenu}>
                Không
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderAdmin;