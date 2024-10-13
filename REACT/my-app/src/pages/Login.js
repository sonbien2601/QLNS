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

      // Navigate based on role and reload the page
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
      window.location.reload();
    } catch (error) {
      console.error('Login error:', error);
      
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
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formContainer}>
          <h2 style={styles.title}>Đăng nhập</h2>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email hoặc tên đăng nhập
                <input
                  type="text"
                  placeholder="Email hoặc tên đăng nhập"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  style={styles.input}
                />
              </label>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mật khẩu
                <input
                  type="password"
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </label>
            </div>
            <button type="submit" style={styles.submitButton}>Đăng nhập</button>
          </form>
          <div style={styles.forgotPassword}>
            <a href="/forgot-password" style={styles.link}>Quên mật khẩu?</a>
          </div>
          <div style={styles.socialLogin}>
            <button type="button" style={styles.socialButton}>
              Đăng nhập bằng Google
            </button>
            <button type="button" style={styles.socialButton}>
              Đăng nhập bằng Microsoft
            </button>
          </div>
        </div>
        <div style={styles.imageContainer}>
          <img 
            src="https://i.pinimg.com/564x/2f/0c/80/2f0c8049858283f6b901f529efcb05c0.jpg" 
            alt="Login page illustration" 
            style={styles.image}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f9',
  },
  container: {
    display: 'flex',
    width: '80%',
    maxWidth: '1200px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
  },
  formContainer: {
    flex: 1,
    padding: '40px',
  },
  title: {
    fontSize: '32px',
    marginBottom: '30px',
    color: '#2c3e50',
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#34495e',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    transition: 'border-color 0.3s ease',
  },
  submitButton: {
    padding: '12px',
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  forgotPassword: {
    textAlign: 'center',
    margin: '20px 0',
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
  },
  socialLogin: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  socialButton: {
    padding: '12px',
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  imageContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'cover',
  },
  error: {
    backgroundColor: '#fde8e8',
    color: '#e74c3c',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
};

export default Login;