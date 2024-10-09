import React, { useState } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';

const AddEmployee = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '', // Thêm trường username
    email: '',
    password: '',
    confirmPassword: '', // Thêm trường xác nhận mật khẩu
    phoneNumber: '',
    position: '',
  });

  const [errors, setErrors] = useState({}); // State để lưu các lỗi validation

  const validateForm = () => {
    const newErrors = {};
    
    // Kiểm tra các trường bắt buộc
    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập tên nhân viên';
    if (!formData.username) newErrors.username = 'Vui lòng nhập tên đăng nhập';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.position) newErrors.position = 'Vui lòng nhập chức vụ';

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Kiểm tra mật khẩu khớp nhau
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Dừng nếu form không hợp lệ
    }

    try {
      const { confirmPassword, ...submitData } = formData; // Loại bỏ trường confirmPassword
      const response = await axios.post('http://localhost:5000/api/auth/create-user', submitData);
      
      console.log('Tạo tài khoản thành công:', response.data);
      alert('Tạo tài khoản thành công!');
      
      // Reset form
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        position: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Lỗi khi tạo tài khoản:', error);
      alert(error.response?.data?.message || 'Tạo tài khoản thất bại, vui lòng thử lại.');
    }
  };

  return (
    <div>
      <NavigationAdmin />
      <div className="container mt-5">
        <h2 className="mb-4">Thêm Nhân Viên Mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Tên Nhân Viên:</label>
            <input
              type="text"
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Tên đăng nhập:</label>
            <input
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Mật khẩu:</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Xác nhận mật khẩu:</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Số điện thoại:</label>
            <input
              type="tel"
              className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Chức vụ:</label>
            <input
              type="text"
              className={`form-control ${errors.position ? 'is-invalid' : ''}`}
              name="position"
              value={formData.position}
              onChange={handleChange}
            />
            {errors.position && <div className="invalid-feedback">{errors.position}</div>}
          </div>

          <button type="submit" className="btn btn-primary">Thêm Nhân Viên</button>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;