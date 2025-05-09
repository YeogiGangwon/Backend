const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  address: String,
  latitude: Number,
  longitude: Number,
  image_url: String,
  open_hours: String,
  fee_info: String
});

module.exports = mongoose.model('Place', placeSchema);