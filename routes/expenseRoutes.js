
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Booking = require('../models/Booking');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// COORDINATOR: View all expenses
router.get('/', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('booking', 'eventName eventDate clientName')
      .sort({ expenseDate: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve expenses.',
      error: error.message
    });
  }
});

// COORDINATOR: Add a new expense
router.post('/', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const {
      expenseName,
      expenseType,
      category,
      amount,
      expenseDate,
      booking,
      description
    } = req.body;

    if (
      !expenseName ||
      !expenseType ||
      !category ||
      !amount ||
      !expenseDate
    ) {
      return res.status(400).json({
        message: 'Please complete all required expense fields.'
      });
    }

    if (
      !['Event Expense', 'Monthly Operating Expense'].includes(expenseType)
    ) {
      return res.status(400).json({
        message: 'Invalid expense type.'
      });
    }

    if (Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
      return res.status(400).json({
        message: 'Expense amount must be greater than zero.'
      });
    }

    if (expenseType === 'Event Expense') {
      if (!booking) {
        return res.status(400).json({
          message: 'Please select the event for this expense.'
        });
      }

      if (!mongoose.isValidObjectId(booking)) {
        return res.status(400).json({
          message: 'Invalid booking selected.'
        });
      }

      if (!(await Booking.exists({ _id: booking }))) {
        return res.status(404).json({
          message: 'Selected booking was not found.'
        });
      }
    }

    const newExpense = await Expense.create({
      expenseName,
      expenseType,
      category,
      amount: Number(amount),
      expenseDate,
      booking: expenseType === 'Event Expense' ? booking : null,
      description,
      status: 'Active'
    });

    const savedExpense = await Expense.findById(newExpense._id)
      .populate('booking', 'eventName eventDate clientName');

    res.status(201).json({
      message: 'Expense added successfully!',
      expense: savedExpense
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to add expense.',
      error: error.message
    });
  }
});

// COORDINATOR: Cancel an expense without deleting its record
router.patch('/:id/cancel', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense ID.'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found.'
      });
    }

    if (expense.status === 'Cancelled') {
      return res.status(400).json({
        message: 'This expense is already cancelled.'
      });
    }

    expense.status = 'Cancelled';
    await expense.save();

    const cancelledExpense = await Expense.findById(expense._id)
      .populate('booking', 'eventName eventDate clientName');

    res.json({
      message: 'Expense cancelled successfully!',
      expense: cancelledExpense
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to cancel expense.',
      error: error.message
    });
  }
});

module.exports = router;
