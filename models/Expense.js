
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseName: {
      type: String,
      required: true,
      trim: true
    },

    expenseType: {
      type: String,
      required: true,
      enum: [
        'Event Expense',
        'Monthly Operating Expense'
      ]
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    expenseDate: {
      type: Date,
      required: true
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: function () {
        return this.expenseType === 'Event Expense';
      },
      default: null
    },

      description: {
      type: String,
      default: '',
      trim: true
    },

    status: {
      type: String,
      enum: ['Active', 'Cancelled'],
      default: 'Active'
    }
    
  },
  
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Expense ||
  mongoose.model('Expense', expenseSchema);
