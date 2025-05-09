const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  rec_score: { type: Number, default: 0 },
  reason: { type: String, maxlength: 255 },
  rec_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
