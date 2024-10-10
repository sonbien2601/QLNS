import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        login,
        password,
      });

      // Store auth data
      const { token, userId, role, fullName, username } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('username', username);

      // Configure axios with the new token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Navigate based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error message
      if (error.response) {
        setError(error.response.data.message || 'Đăng nhập thất bại, vui lòng kiểm tra thông tin đăng nhập');
      } else if (error.request) {
        setError('Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối Internet của bạn.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container">
        <h2>Đăng nhập</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <label>
            Email hoặc tên đăng nhập *
            <input
              type="text"
              placeholder="Email hoặc tên đăng nhập"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </label>
          <label>
            Mật khẩu *
            <input
              type="password"
              placeholder="Mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Đăng nhập</button>
        </form>
        <div>
          <a href="/forgot-password">Quên mật khẩu?</a>
        </div>
        <div>
          <button type="button" className="social-login">
            Đăng nhập bằng Google
          </button>
          <button type="button" className="social-login">
            Đăng nhập bằng Microsoft
          </button>
        </div>
      </div>
      <div className="image-container">
        <img 
          src="https://i.pinimg.com/564x/2f/0c/80/2f0c8049858283f6b901f529efcb05c0.jpg" 
          alt="Login page illustration" 
        />
      </div>
    </div>
  );
};

export default Login;
