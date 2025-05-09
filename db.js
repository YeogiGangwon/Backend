const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB 연결 성공!');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err);
  }
}

module.exports = connectDB;