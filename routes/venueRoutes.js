
const express = require('express');
const router = express.Router();

const Venue = require('../models/Venue');
const { protect, allowRoles } = require('../middleware/authMiddleware');


// CLIENT AND COORDINATOR: View venues
router.get('/', protect, async (req, res) => {
  try {
    const filter =
      req.user.role === 'Coordinator'
        ? {}
        : { isAvailable: true };

    const venues = await Venue.find(filter)
      .sort({ createdAt: -1 });

    res.json(venues);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve venues.',
      error: error.message
    });
  }
});


// COORDINATOR: Add a venue
router.post('/', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const newVenue = await Venue.create(req.body);

    res.status(201).json({
      message: 'Venue added successfully!',
      venue: newVenue
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to add venue.',
      error: error.message
    });
  }
});

// COORDINATOR: Update a venue
router.put('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVenue) {
      return res.status(404).json({ message: 'Venue not found.' });
    }

    res.json({
      message: 'Venue updated successfully!',
      venue: updatedVenue
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update venue.',
      error: error.message
    });
  }
});

// COORDINATOR: Delete a venue
router.delete('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const deletedVenue = await Venue.findByIdAndDelete(req.params.id);

    if (!deletedVenue) {
      return res.status(404).json({ message: 'Venue not found.' });
    }

    res.json({ message: 'Venue deleted successfully!' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete venue.',
      error: error.message
    });
  }
});

module.exports = router;
