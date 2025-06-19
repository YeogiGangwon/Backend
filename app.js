const express = require('express');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user.routes');
const placeRoutes = require('./routes/place.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const weatherRoutes = require('./routes/weather.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const congestionRoutes = require('./routes/congestion.routes');
const tourRoutes = require('./routes/tour.routes');
const durunubiRoutes = require('./routes/durunubi.route');

// CORS 허용
app.use(cors());

// 미들웨어 설정
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/durunubi', durunubiRoutes);
app.use('/api/tour', tourRoutes);
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/congestion', congestionRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
