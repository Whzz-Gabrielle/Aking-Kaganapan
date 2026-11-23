const express = require('express');
const router = express.Router();

const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { HttpError, validateIdParam } = require('../middleware/errorMiddleware');

router.param('id', validateIdParam);

const FIELDS = [
  'venueName', 'venueType', 'address', 'description', 'eventTheme',
  'colorMotif', 'inclusions', 'capacity', 'rentalPrice', 'imageUrl', 'isAvailable'
];

function pickFields(body = {}) {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (typeof data.inclusions === 'string') {
    data.inclusions = data.inclusions.split(/[\n,]/).map((i) => i.trim()).filter(Boolean);
  }
  return data;
}

// CLIENT AND COORDINATOR: View venues (clients only see available ones)
router.get('/', protect, async (req, res) => {
  const filter = req.user.role === 'Coordinator' ? {} : { isAvailable: true };
  const venues = await Venue.find(filter).sort({ createdAt: -1 });
  res.json(venues);
});

// COORDINATOR: Add a venue
router.post('/', protect, allowRoles('Coordinator'), async (req, res) => {
  const newVenue = await Venue.create(pickFields(req.body));
  res.status(201).json({ message: 'Venue added successfully!', venue: newVenue });
});

// COORDINATOR: Update a venue
router.put('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  const updatedVenue = await Venue.findByIdAndUpdate(
    req.params.id,
    { $set: pickFields(req.body) },
    { new: true, runValidators: true }
  );

  if (!updatedVenue) throw new HttpError(404, 'Venue not found.');

  res.json({ message: 'Venue updated successfully!', venue: updatedVenue });
});

// COORDINATOR: Delete a venue that no booking uses
router.delete('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  if (await Booking.exists({ venue: req.params.id })) {
    throw new HttpError(
      409,
      'This venue is used by existing bookings. Mark it as unavailable instead of deleting it.'
    );
  }

  const deletedVenue = await Venue.findByIdAndDelete(req.params.id);

  if (!deletedVenue) throw new HttpError(404, 'Venue not found.');

  res.json({ message: 'Venue deleted successfully!' });
});

module.exports = router;
