const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

// 복합 인덱스 생성 (중복 방지 및 성능 향상)
favoriteSchema.index({ user_id: 1, place_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
