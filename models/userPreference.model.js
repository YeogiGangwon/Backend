const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  theme: { type: String, maxlength: 50 }
});

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
