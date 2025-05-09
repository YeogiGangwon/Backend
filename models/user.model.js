const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, maxlength: 100 },
  password: { type: String, required: true },
  nickname: { type: String, maxlength: 50 },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
