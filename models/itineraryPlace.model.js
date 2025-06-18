const mongoose = require('mongoose');

const itineraryPlaceSchema = new mongoose.Schema({
  itinerary_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Itinerary', 
    required: true 
  },
  place_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Place', 
    required: true 
  },
  visit_order: Number,                   // 방문 순서
  scheduled_time: Number,               // 소요 시간 (단위: 분)
  user_note: String                     // 사용자 메모
});

module.exports = mongoose.model('ItineraryPlace', itineraryPlaceSchema);
