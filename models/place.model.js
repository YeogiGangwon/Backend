const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  address: String,
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
});

module.exports = mongoose.model('Place', placeSchema);
