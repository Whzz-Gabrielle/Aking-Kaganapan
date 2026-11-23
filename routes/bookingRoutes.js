const express = require('express');
const router = express.Router();

const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Venue = require('../models/Venue');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { HttpError, validateIdParam } = require('../middleware/errorMiddleware');
const { updateBookingPaymentSummary } = require('../utils/paymentSummary');

const PAYMENT_METHODS = ['GCash', 'Maya', 'Bank Transfer', 'Cash'];

// Allowed booking status changes. Completed is final; Cancelled can be reopened.
const STATUS_FLOW = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Completed', 'Cancelled'],
  Cancelled: ['Pending'],
  Completed: []
};

const coordinatorOnly = [protect, allowRoles('Coordinator')];
const clientOnly = [protect, allowRoles('Client')];

router.param('id', validateIdParam);

// A client owns a booking if it is linked to their account, or (older records)
// was created with their email before bookings were linked to accounts.
const ownsBooking = (booking, user) =>
  (booking.client && booking.client.equals(user._id)) ||
  (!booking.client && booking.clientEmail === user.email);

function parseEventDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Please enter a valid event date.');
  }
  return date;
}

// GET: Clients get their own bookings. Coordinators get all bookings.
router.get('/', protect, async (req, res) => {
  const filter =
    req.user.role === 'Coordinator'
      ? {}
      : {
          $or: [
            { client: req.user._id },
            { client: null, clientEmail: req.user.email }
          ]
        };

  const bookings = await Booking.find(filter).sort({ createdAt: -1 });
  res.status(200).json(bookings);
});

// GET: One booking. Clients can only view their own.
router.get('/:id', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) throw new HttpError(404, 'Booking not found.');

  if (req.user.role !== 'Coordinator' && !ownsBooking(booking, req.user)) {
    throw new HttpError(403, 'You do not have permission to view this booking.');
  }

  res.status(200).json(booking);
});

// POST: A client creates a booking request.
router.post('/', ...clientOnly, async (req, res) => {
  const {
    clientName,
    eventName,
    eventDate,
    eventLocation,
    eventTheme,
    specialRequests,
    packageId,
    venueId,
    preferredPaymentMethod
  } = req.body || {};

  if (!eventName?.trim() || !eventDate || !eventLocation?.trim() || !eventTheme?.trim()) {
    throw new HttpError(400, 'Please complete all required booking fields.');
  }

  const date = parseEventDate(eventDate);
  // Allow one day of slack: the browser sends a plain date, which is read as UTC midnight.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  startOfToday.setDate(startOfToday.getDate() - 1);

  if (date < startOfToday) {
    throw new HttpError(400, 'Event date cannot be in the past.');
  }

  if (preferredPaymentMethod && !PAYMENT_METHODS.includes(preferredPaymentMethod)) {
    throw new HttpError(400, 'Please choose a valid payment method.');
  }

  // Look up the chosen package/venue so the price starts from real data,
  // not from anything the browser sends.
  let pkg = null;
  let venue = null;

  if (packageId) {
    pkg = await Package.findOne({ _id: packageId, isAvailable: true });
    if (!pkg) throw new HttpError(400, 'The selected package is no longer available.');
  }

  if (venueId) {
    venue = await Venue.findOne({ _id: venueId, isAvailable: true });
    if (!venue) throw new HttpError(400, 'The selected venue is no longer available.');
  }

  const booking = await Booking.create({
    client: req.user._id,
    clientName: (clientName || req.user.fullName).trim(),
    clientEmail: req.user.email,
    eventName: eventName.trim(),
    eventDate: date,
    eventLocation: eventLocation.trim(),
    eventTheme: eventTheme.trim(),
    specialRequests: specialRequests || '',
    package: pkg?._id || null,
    venue: venue?._id || null,
    totalPrice: Number(pkg?.price || 0) + Number(venue?.rentalPrice || 0),
    preferredPaymentMethod: preferredPaymentMethod || undefined,
    paymentStatus: 'Unpaid',
    bookingStatus: 'Pending'
  });

  res.status(201).json({
    message: 'Booking request submitted successfully!',
    booking
  });
});

// PATCH: A client cancels their own booking (only while nothing has been paid).
router.patch('/:id/cancel', ...clientOnly, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking || !ownsBooking(booking, req.user)) {
    throw new HttpError(404, 'Booking not found.');
  }

  if (!['Pending', 'Approved'].includes(booking.bookingStatus)) {
    throw new HttpError(400, `A ${booking.bookingStatus.toLowerCase()} booking cannot be cancelled.`);
  }

  if (Number(booking.amountPaid || 0) > 0) {
    throw new HttpError(
      400,
      'This booking already has verified payments. Please contact the Coordinator to cancel it.'
    );
  }

  booking.bookingStatus = 'Cancelled';
  await booking.save();

  res.status(200).json({ message: 'Booking cancelled.', booking });
});

// PUT: Coordinator updates a booking.
router.put('/:id', ...coordinatorOnly, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) throw new HttpError(404, 'Booking not found.');

  const body = req.body || {};
  const textFields = ['clientName', 'eventName', 'eventLocation', 'eventTheme', 'specialRequests'];

  for (const field of textFields) {
    if (body[field] !== undefined) booking[field] = body[field];
  }

  if (body.eventDate !== undefined) {
    booking.eventDate = parseEventDate(body.eventDate);
  }

  if (body.preferredPaymentMethod !== undefined) {
    if (body.preferredPaymentMethod && !PAYMENT_METHODS.includes(body.preferredPaymentMethod)) {
      throw new HttpError(400, 'Please choose a valid payment method.');
    }
    booking.preferredPaymentMethod = body.preferredPaymentMethod || undefined;
  }

  let priceChanged = false;

  if (body.totalPrice !== undefined && body.totalPrice !== '') {
    const price = Number(body.totalPrice);

    if (!Number.isFinite(price) || price < 0) {
      throw new HttpError(400, 'Total price must be a number that is zero or more.');
    }

    if (price !== booking.totalPrice) {
      if (price > 0 && price < Number(booking.amountPaid || 0)) {
        throw new HttpError(
          400,
          'Total price cannot be lower than the amount already verified as paid.'
        );
      }
      booking.totalPrice = price;
      priceChanged = true;
    }
  }

  if (body.bookingStatus !== undefined && body.bookingStatus !== booking.bookingStatus) {
    const allowed = STATUS_FLOW[booking.bookingStatus] || [];

    if (!allowed.includes(body.bookingStatus)) {
      throw new HttpError(
        400,
        `A ${booking.bookingStatus.toLowerCase()} booking cannot be changed to ${body.bookingStatus}.`
      );
    }

    if (body.bookingStatus === 'Approved' && Number(booking.totalPrice) <= 0) {
      throw new HttpError(400, 'Set the total event price before approving this booking.');
    }

    booking.bookingStatus = body.bookingStatus;
  }

  // paymentStatus is derived from verified payments, so it is not editable here.
  await booking.save();

  const saved = priceChanged
    ? await updateBookingPaymentSummary(booking._id)
    : booking;

  res.status(200).json({ message: 'Booking updated successfully!', booking: saved });
});

// DELETE: Coordinator deletes a booking that has no payments or expenses.
router.delete('/:id', ...coordinatorOnly, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) throw new HttpError(404, 'Booking not found.');

  const [paymentCount, expenseCount] = await Promise.all([
    Payment.countDocuments({ booking: booking._id }),
    Expense.countDocuments({ booking: booking._id })
  ]);

  if (paymentCount > 0 || expenseCount > 0) {
    throw new HttpError(
      409,
      'This booking has payment or expense records. Cancel it instead of deleting it.'
    );
  }

  await booking.deleteOne();

  res.status(200).json({ message: 'Booking deleted successfully!', booking });
});

module.exports = router;
