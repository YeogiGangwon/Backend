const express = require('express');
const app = express();
const userRoutes = require('./routes/user.routes');
const placeRoutes = require('./routes/place.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const weatherRoutes = require('./routes/weather.routes');

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/weather', weatherRoutes);

module.exports = app;
