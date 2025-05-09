const mongoose = require('mongoose');

const congestionSchema = new mongoose.Schema({
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  timestamp: { type: Date, default: Date.now },
  cctv_source_url: String,
  congestion_score: { type: Number, min: 0, max: 100 },
  person_count: Number
});

module.exports = mongoose.model('Congestion', congestionSchema);
