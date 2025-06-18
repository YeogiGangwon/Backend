const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const placeRoutes = require('./routes/place.routes');
app.use('/api/places', placeRoutes);

const itineraryPlaceRoutes = require('./routes/itineraryPlace.routes');
app.use('/api/itinerary-places', itineraryPlaceRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
