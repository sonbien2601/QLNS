const express = require('express'); // Nhập thư viện Express
const mongoose = require('mongoose'); // Nhập thư viện Mongoose để kết nối MongoDB
const cors = require('cors'); // Nhập middleware CORS

const app = express(); // Tạo một ứng dụng Express
app.use(cors()); // Kích hoạt CORS cho tất cả các route
app.use(express.json()); // Kích hoạt việc phân tích các yêu cầu có định dạng JSON

// Kết nối đến MongoDB, sử dụng cơ sở dữ liệu QLNS_DB
const mongoURI = 'mongodb://localhost:27017/QLNS_DB';  // Đường dẫn kết nối MongoDB

// Kết nối đến MongoDB sử dụng Mongoose
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Kết nối đến MongoDB thành công!'); // In ra thông báo khi kết nối thành công
    console.log(`Tên cơ sở dữ liệu đang kết nối: ${mongoose.connection.db.databaseName}`); // In ra tên cơ sở dữ liệu đang kết nối
  })
  .catch((error) => {
    console.error('Lỗi kết nối MongoDB:', error); // In ra thông báo lỗi nếu kết nối thất bại
  });

// Định nghĩa các route API
app.use('/api/auth', require('./routes/auth')); // Sử dụng các route trong tệp auth.js cho endpoint /api/auth

// Khởi động server
const PORT = process.env.PORT || 5000; // Định nghĩa cổng để lắng nghe, mặc định là 5000 nếu không có trong biến môi trường
app.listen(PORT, () => {
  console.log(`Server chạy trên cổng ${PORT}`); // In ra thông báo khi server bắt đầu chạy và cổng đang lắng nghe
});