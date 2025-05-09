const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  location: String,
  start_date: Date,
  end_date: Date,
  image_url: String,
  place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' } // Nullable 가능
});

module.exports = mongoose.model('Event', eventSchema);
