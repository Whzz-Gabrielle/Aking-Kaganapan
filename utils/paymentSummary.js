const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Recalculate amountPaid and paymentStatus from VERIFIED payments only.
// Used after a payment is reviewed and after the coordinator changes the price.
async function updateBookingPaymentSummary(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  const result = await Payment.aggregate([
    { $match: { booking: booking._id, verificationStatus: 'Verified' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const verifiedAmount = result.length > 0 ? result[0].total : 0;
  const totalPrice = Number(booking.totalPrice || 0);

  booking.amountPaid = verifiedAmount;

  if (verifiedAmount === 0 || totalPrice <= 0) {
    booking.paymentStatus = 'Unpaid';
  } else if (verifiedAmount >= totalPrice) {
    booking.paymentStatus = 'Fully Paid';
  } else {
    booking.paymentStatus = 'Half Payment';
  }

  await booking.save();
  return booking;
}

module.exports = { updateBookingPaymentSummary };
