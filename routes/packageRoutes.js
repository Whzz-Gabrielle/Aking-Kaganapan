const express = require('express');
const router = express.Router();

const Package = require('../models/Package');
const Booking = require('../models/Booking');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { HttpError, validateIdParam } = require('../middleware/errorMiddleware');

router.param('id', validateIdParam);

const FIELDS = [
  'packageName', 'eventType', 'eventTheme', 'colorMotif', 'pax',
  'description', 'inclusions', 'price', 'imageUrl', 'isAvailable'
];

// Only accept known fields, and accept inclusions as a list or comma/line text.
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

// CLIENT AND COORDINATOR: View packages (clients only see available ones)
router.get('/', protect, async (req, res) => {
  const filter = req.user.role === 'Coordinator' ? {} : { isAvailable: true };
  const packages = await Package.find(filter).sort({ createdAt: -1 });
  res.json(packages);
});

// COORDINATOR: Add a package
router.post('/', protect, allowRoles('Coordinator'), async (req, res) => {
  const newPackage = await Package.create(pickFields(req.body));
  res.status(201).json({ message: 'Package added successfully!', package: newPackage });
});

// COORDINATOR: Update a package
router.put('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  const updatedPackage = await Package.findByIdAndUpdate(
    req.params.id,
    { $set: pickFields(req.body) },
    { new: true, runValidators: true }
  );

  if (!updatedPackage) throw new HttpError(404, 'Package not found.');

  res.json({ message: 'Package updated successfully!', package: updatedPackage });
});

// COORDINATOR: Delete a package that no booking uses
router.delete('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  if (await Booking.exists({ package: req.params.id })) {
    throw new HttpError(
      409,
      'This package is used by existing bookings. Mark it as unavailable instead of deleting it.'
    );
  }

  const deletedPackage = await Package.findByIdAndDelete(req.params.id);

  if (!deletedPackage) throw new HttpError(404, 'Package not found.');

  res.json({ message: 'Package deleted successfully!' });
});

module.exports = router;
