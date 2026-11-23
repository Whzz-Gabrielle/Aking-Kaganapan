
const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    venueName: {
      type: String,
      required: true,
      trim: true
    },

    venueType: {
      type: String,
      required: true,
      enum: [
        'Hotel',
        'Studio',
        'Function Hall',
        'Other Event Venue',
        'Restaurant',
        'Resort'
      ],
      default: 'Other Event Venue'
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

     eventTheme: {
  type: String,
  default: '',
  trim: true
},

colorMotif: {
  type: String,
  default: '',
  trim: true
},

inclusions: {
  type: [String],
  default: []
},

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    rentalPrice: {
      type: Number,
      default: 0,
      min: 0
    },

    imageUrl: {
      type: String,
      default: ''
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Venue ||
  mongoose.model('Venue', venueSchema);
