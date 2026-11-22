
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      trim: true
    },

    eventType: {
      type: String,
      required: true,
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

pax: {
  type: Number,
  default: 0,
  min: 0
},

    description: {
      type: String,
      default: '',
      trim: true
    },

    inclusions: {
      type: [String],
      default: []
    },

    price: {
      type: Number,
      required: true,
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
  mongoose.models.Package ||
  mongoose.model('Package', packageSchema);
