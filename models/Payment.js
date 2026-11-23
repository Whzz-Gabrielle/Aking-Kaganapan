
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: ['GCash', 'Maya', 'Bank Transfer', 'Cash'],
      required: true,
      trim: true,
    },

    referenceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    proofOfPayment: {
      type: String,
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },

    coordinatorRemarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Payment ||
  mongoose.model('Payment', paymentSchema);
