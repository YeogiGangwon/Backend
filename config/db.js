const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1); // 실패 시 서버 종료
  }
};

module.exports = connectDB;
