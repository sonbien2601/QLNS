const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối đến MongoDB, sử dụng cơ sở dữ liệu QLNS_DB
const mongoURI = 'mongodb://localhost:27017/QLNS_DB';  // Đường dẫn MongoDB

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Kết nối đến MongoDB thành công!');
    console.log(`Tên cơ sở dữ liệu đang kết nối: ${mongoose.connection.db.databaseName}`);
  })
  .catch((error) => {
    console.error('Lỗi kết nối MongoDB:', error);
  });

// Định nghĩa các route API
app.use('/api/auth', require('./routes/auth'));

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy trên cổng ${PORT}`);
});
