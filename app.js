const express = require('express');
require('dotenv').config();
const app = express();
const userRoutes = require('./routes/user.routes');
const placeRoutes = require('./routes/place.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const weatherRoutes = require('./routes/weather.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/recommendations', recommendationRoutes);

const PORT = process.env.PORT || 8080;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
