
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    clientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    
    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    eventLocation: {
      type: String,
      required: true,
      trim: true,
    },

    eventTheme: {
      type: String,
      required: true,
      trim: true,
    },

    specialRequests: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1500,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },

    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
    },

    // Set by the coordinator (pre-filled from the chosen package + venue).
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Sum of VERIFIED payments. Maintained by the payment review flow.
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    preferredPaymentMethod: {
      type: String,
      enum: ['GCash', 'Maya', 'Bank Transfer', 'Cash'],
    },

    paymentStatus: {
      type: String,
      enum: ['Half Payment', 'Fully Paid', 'Unpaid'],
      default: 'Unpaid',
    },

    bookingStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Booking ||
  mongoose.model('Booking', bookingSchema);
