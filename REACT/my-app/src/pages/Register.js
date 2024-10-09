import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import backgroundImage from '../images/xe.jpg';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate(); // Khởi tạo useNavigate
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    position: '',
    companyName: '',
    city: '',
    staffSize: '',
  });

  // Định nghĩa hàm handleChange
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Hàm xử lý đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(`Đăng ký thành công với vai trò ${response.data.role}`);
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      alert(error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container">
        <h2>Đăng ký</h2>
        <form onSubmit={handleRegister}>
          <label>Tên đăng nhập *<input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Tên đăng nhập"
            required
          />
          </label>
          <label>
            Họ và tên bạn *
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Tên của bạn" required />
          </label>
          <label>
            Mật khẩu *
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu của bạn" required />
          </label>
          <label>
            Nhập lại mật khẩu *
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu" required />
          </label>
          <label>
            Email của bạn *
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email của bạn" required />
          </label>
          <label>
            Số điện thoại *
            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Số điện thoại của bạn" required />
          </label>
          <label>
            Vị trí công việc *
            <select name="position" value={formData.position} onChange={handleChange} required>
              <option value="">-- Vị trí công việc của bạn --</option>
              <option value="developer">Nhà phát triển</option>
              <option value="designer">Nhà thiết kế</option>
              <option value="manager">Quản lý</option>
            </select>
          </label>
          <label>
            Tên công ty *
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Tên công ty của bạn" required />
          </label>
          <label>
            Tỉnh/Thành phố *
            <select name="city" value={formData.city} onChange={handleChange} required>
              <option value="">-- Tỉnh/Thành phố --</option>
              <option value="hanoi">Hà Nội</option>
              <option value="hcm">Thành phố Hồ Chí Minh</option>
              <option value="danang">Đà Nẵng</option>
            </select>
          </label>
          <label>
            Quy mô nhân sự *
            <select name="staffSize" value={formData.staffSize} onChange={handleChange} required>
              <option value="">-- Quy mô nhân sự --</option>
              <option value="small">Dưới 50</option>
              <option value="medium">50 - 200</option>
              <option value="large">Trên 200</option>
            </select>
          </label>
          <button type="submit">Đăng ký</button>
        </form>
      </div>
      <div className="image-container">
        <img src="https://i.pinimg.com/564x/90/12/49/901249a8ae019150973b167254792531.jpg" alt="Description" />
      </div>
    </div>
  );
};

export default Register;
