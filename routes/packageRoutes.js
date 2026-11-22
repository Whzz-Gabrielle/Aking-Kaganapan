
const express = require('express');
const router = express.Router();

const Package = require('../models/Package');
const { protect, allowRoles } = require('../middleware/authMiddleware');

// CLIENT AND COORDINATOR: View available packages

// CLIENT AND COORDINATOR: View packages
router.get('/', protect, async (req, res) => {
  try {
    const filter =
      req.user.role === 'Coordinator'
        ? {}
        : { isAvailable: true };

    const packages = await Package.find(filter)
      .sort({ createdAt: -1 });

    res.json(packages);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve packages.',
      error: error.message
    });
  }
});

// COORDINATOR: Add a package
router.post('/', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const newPackage = await Package.create(req.body);

    res.status(201).json({
      message: 'Package added successfully!',
      package: newPackage
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to add package.',
      error: error.message
    });
  }
});

// COORDINATOR: Update a package
router.put('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    res.json({
      message: 'Package updated successfully!',
      package: updatedPackage
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update package.',
      error: error.message
    });
  }
});

// COORDINATOR: Delete a package
router.delete('/:id', protect, allowRoles('Coordinator'), async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);

    if (!deletedPackage) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    res.json({ message: 'Package deleted successfully!' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete package.',
      error: error.message
    });
  }
});

module.exports = router;
