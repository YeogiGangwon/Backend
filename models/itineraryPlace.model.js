const mongoose = require('mongoose');

const itineraryPlaceSchema = new mongoose.Schema({
  itinerary_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  visit_order: Number,
  scheduled_time: Number, // 단위: 분 (예: 30분)
  user_note: String
});

module.exports = mongoose.model('ItineraryPlace', itineraryPlaceSchema);
