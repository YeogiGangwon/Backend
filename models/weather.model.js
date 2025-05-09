const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  timestamp: { type: Date, default: Date.now },
  weather: String,
  temperature: Number,
  rain_chance: Number
});

module.exports = mongoose.model('Weather', weatherSchema);
