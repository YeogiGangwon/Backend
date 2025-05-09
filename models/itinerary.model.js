const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, maxlength: 100 },
  travel_date: Date,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
