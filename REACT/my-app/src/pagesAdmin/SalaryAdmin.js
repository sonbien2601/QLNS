import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavigationAdmin from '../components/NavigationAdmin';
import '../css/style.css';

const SalaryRow = ({ salary, handleUpdate, handleDelete }) => {
  const [basicSalary, setBasicSalary] = useState(salary.basicSalary);
  const [bonus, setBonus] = useState(salary.bonus);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleUpdate(salary.userId?._id, basicSalary, bonus);
  };

  return (
    <tr>
      <td>{salary.userId?.fullName || 'N/A'}</td>
      <td>{salary.userId?.position || 'N/A'}</td>
      <td>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            value={basicSalary} 
            onChange={(e) => setBasicSalary(Number(e.target.value))} 
            required 
            placeholder="Lương cơ bản"
          />
          <input 
            type="number" 
            value={bonus} 
            onChange={(e) => setBonus(Number(e.target.value))} 
            required 
            placeholder="Thưởng"
          />
          <button type="submit">Cập Nhật</button>
          <button type="button" onClick={() => handleDelete(salary.userId?._id)}>Xóa</button>
        </form>
      </td>
    </tr>
  );
};

const SalaryAdmin = () => {
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    const fetchSalaries = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/auth/salary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalaries(response.data.salaries.filter(salary => salary.userId != null));
      } catch (error) {
        console.error('Lỗi khi lấy lương:', error);
      }
    };

    fetchSalaries();
  }, []);

  const handleUpdate = async (userId, basicSalary, bonus) => {
    if (!userId) {
      console.error('User ID is null or undefined');
      alert('Không thể cập nhật lương cho người dùng không xác định');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5000/api/auth/salary/${userId}`, {
        basicSalary,
        bonus
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Cập nhật lại danh sách lương sau khi cập nhật
      const updatedSalaries = salaries.map(salary => 
        salary.userId?._id === userId ? { ...salary, basicSalary, bonus } : salary
      );
      setSalaries(updatedSalaries);
      alert('Cập nhật lương thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật lương:', error);
      alert('Lỗi khi cập nhật lương');
    }
  };

  const handleDelete = async (userId) => {
    if (!userId) {
      console.error('User ID is null or undefined');
      alert('Không thể xóa lương cho người dùng không xác định');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/auth/salary/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Cập nhật lại danh sách lương sau khi xóa
      setSalaries(salaries.filter(salary => salary.userId?._id !== userId));
      alert('Xóa lương thành công');
    } catch (error) {
      console.error('Lỗi khi xóa lương:', error);
      alert('Lỗi khi xóa lương');
    }
  };

  return (
    <div className="main-container">
      <NavigationAdmin />
      <div className="content">
        <h2>Quản Lý Lương</h2>
        <table className="applicant-table">
          <thead>
            <tr>
              <th>Tên Nhân Viên</th>
              <th>Chức Vụ</th>
              <th>Cập Nhật Lương và Thưởng</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((salary) => (
              <SalaryRow key={salary.userId?._id || salary._id} salary={salary} handleUpdate={handleUpdate} handleDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryAdmin;