const express = require('express');
const app = express();
const userRoutes = require('./routes/user.routes');
const placeRoutes = require('./routes/place.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const weatherRoutes = require('./routes/weather.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const congestionRoutes = require('./routes/congestion.routes');
const tourRoutes = require('./routes/tour.routes');
const durunubiRoutes = require('./routes/durunubi.route');


app.use('/api/durunubi', durunubiRoutes);
app.use('/api/tour', tourRoutes);
app.use(express.json());
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
