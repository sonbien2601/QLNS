import React from 'react';
import { useNavigate } from 'react-router-dom';

const Introduce = () => {

  const navigate = useNavigate();
  const handleRegisterClick = () => {
    navigate('/register'); // Điều hướng đến trang đăng ký
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        <div style={styles.leftSection}>
          <h1 style={styles.logo}>HRM.VN</h1>
          <h2 style={styles.title}>
            Giải pháp quản trị và phát triển nhân sự
          </h2>
          <p style={styles.description}>
            BinSon HRM là giải pháp giúp bạn phát triển và<br />
            quản lý nhân sự ngày một tốt hơn
          </p>
          <button style={styles.button} onClick={handleRegisterClick}>Đăng Ký</button>
        </div>
        <div style={styles.rightSection}>
          <img src="https://files.oaiusercontent.com/file-yHB3POGBVd36Vjtwhi8Qc8jL?se=2024-10-14T03%3A56%3A44Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3Ddee27511-8da5-49a2-b141-d2e2561706fb.webp&sig=xt5wm9%2BnPf6EEP%2Bw5UH4uX0f2pbqzWJtcTCFoZa2Z0M%3D" alt="HRM Analytics" style={styles.image} />
        </div>
      </div>
      <div style={styles.bottomSpace}></div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0953B8 19%, #042552 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  contentWrapper: {
    display: 'flex',
    flex: 1,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  logo: {
    fontSize: '1.5rem',
    marginBottom: '500px',
    color: 'white',
    textAlign: 'left',
    marginBottom: '180px',
  },
  title: {
    fontSize: '2.5rem',
    color: 'white',
    fontWeight: 'bold',
    marginBottom: '1rem',
    lineHeight: 1.2,
    textAlign: 'left'
  },
  description: {
    fontSize: '1rem',
    marginBottom: '2rem',
    color: 'white',
  },
  button: {
    padding: '0.25rem 1rem', // Giảm padding để nút nhỏ hơn
    width: '150px', // Thiết lập chiều rộng nhỏ hơn
    fontSize: '1rem', // Giảm kích thước chữ nếu cần
    backgroundColor: 'white',
    color: '#0052CC', // Màu chữ xanh
    border: 'none',
    borderRadius: '999px', // Tạo hình dáng tròn cho nút
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Tạo bóng mờ cho nút
    transition: 'background-color 0.3s, color 0.3s',
    marginTop: '100px',
  },
  rightSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '-80px',
    textAlign: 'right'
  },
  leftSection: {
    flex: 1,
    color: 'white',
    paddingRight: '15rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left', // Căn trái nội dung
    marginLeft: '-50px',
  },
  image: {
    maxWidth: '597px',
    height: '424px',
    marginTop: '180px',
    borderRadius: '10px'
  },
  bottomSpace: {
    height: '85px',
    backgroundColor: 'white',
  },
};

export default Introduce;