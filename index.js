const express = require('express');
const app = express();
const port = 3000;
const connectDB = require('./db');
connectDB();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('서버 정상 작동 중');
});

app.listen(port, () => {
  console.log(`서버 실행 중! http://localhost:${port}`);
});

app.post('/signup', (req, res) => {
    const { email, password, nickname } = req.body;
  
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: '모든 항목을 입력하세요!' });
    }
  
    console.log('회원가입 요청:', req.body);
  
    return res.status(201).json({ message: '회원가입 성공!' });
  });
  