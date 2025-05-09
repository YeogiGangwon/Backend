const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  save_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', favoriteSchema);
