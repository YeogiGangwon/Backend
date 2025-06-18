// config/db.js
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Error: MONGO_URI 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    // Mongoose 6 이상에선 기본 옵션으로 처리되므로 옵션 객체는 생략해도 됩니다.
    const conn = await mongoose.connect(uri /*, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }*/);

    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
