
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Booking = require('../models/Booking');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const coordinatorOnly = [protect, allowRoles('Coordinator')];
const clientOnly = [protect, allowRoles('Client')];

// GET: Kunin ang bookings ng naka-login na client.
// Coordinator lang ang maaaring kumuha ng lahat ng bookings.
router.get('/', protect, async (req, res) => {
  try {
    let bookings;

    if (req.user.role === 'Coordinator') {
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      bookings = await Booking.find({
        $or: [
          { client: req.user._id },
          {
            client: { $exists: false },
            clientEmail: req.user.email
          },
          {
            client: null,
            clientEmail: req.user.email
          }
        ]
      }).sort({ createdAt: -1 });
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve bookings.',
      error: error.message
    });
  }
});

// GET: Kunin ang isang booking.
// Client ay maaari lamang tumingin ng sarili niyang booking.
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (
      req.user.role !== 'Coordinator' &&
      booking.clientEmail !== req.user.email
    ) {
      return res.status(403).json({
        message: 'You do not have permission to view this booking.'
      });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve booking.',
      error: error.message
    });
  }
});

// POST: Gumawa ng booking para sa naka-login na client.
router.post('/', ...clientOnly, async (req, res) => {
  try {
    const {
      clientName,
      eventName,
      eventDate,
      eventLocation,
      eventTheme,
      specialRequests
    } = req.body;

    if (
      !clientName ||
      !eventName ||
      !eventDate ||
      !eventLocation ||
      !eventTheme
    ) {
      return res.status(400).json({
        message: 'Please complete all required booking fields.'
      });
    }

    const booking = new Booking({
      client: req.user._id,
      clientName,
      clientEmail: req.user.email,
      eventName,
      eventDate,
      eventLocation,
      eventTheme,
      specialRequests: specialRequests || '',
      paymentStatus: 'Unpaid',
      bookingStatus: 'Pending'
    });

    const savedBooking = await booking.save();

    res.status(201).json({
      message: 'Booking request submitted successfully!',
      booking: savedBooking
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create booking.',
      error: error.message
    });
  }
});

// PUT: Coordinator lang ang maaaring mag-update.
router.put('/:id', ...coordinatorOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const allowedFields = [
      'clientName',
      'clientEmail',
      'eventName',
      'eventDate',
      'eventLocation',
      'eventTheme',
      'specialRequests',
      'paymentStatus',
      'bookingStatus'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({
      message: 'Booking updated successfully!',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update booking.',
      error: error.message
    });
  }
});

// DELETE: Coordinator lang ang maaaring mag-delete.
router.delete('/:id', ...coordinatorOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({
      message: 'Booking deleted successfully!',
      booking: deletedBooking
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete booking.',
      error: error.message
    });
  }
});

module.exports = router;
