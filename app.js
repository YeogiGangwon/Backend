const express = require('express');
const app = express();
const userRoutes = require('./routes/user.routes');
const placeRoutes = require('./routes/place.routes');
const favoriteRoutes = require('./routes/favorite.routes');

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/favorites', favoriteRoutes);

module.exports = app;
