const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  title: { 
    type: String, 
    maxlength: 100 
  },

  travel_date: { 
    type: Date 
  },

  places: [
    {
      place_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Place', 
        required: true 
      },
      visit_order: { 
        type: Number 
      },
      memo: { 
        type: String, 
        maxlength: 300 
      }
    }
  ],

  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
