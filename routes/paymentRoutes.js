
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/uploadMiddleware');
const { HttpError, validateIdParam } = require('../middleware/errorMiddleware');
const { updateBookingPaymentSummary } = require('../utils/paymentSummary');

router.param('id', validateIdParam);

const clientOnly = [protect, allowRoles('Client')];
const coordinatorOnly = [protect, allowRoles('Coordinator')];

// Handle image upload errors from Multer.
function handlePaymentProofUpload(req, res, next) {
  upload.single('proofOfPayment')(req, res, (error) => {
    if (error) {
      // MulterError (e.g. file too large) is translated by the central handler.
      return next(
        error.name === 'MulterError'
          ? error
          : new HttpError(400, error.message || 'Payment proof upload failed.')
      );
    }

    next();
  });
}

// Upload payment proof image to Cloudinary.
function uploadPaymentProof(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'aking-kaganapan/payment-proofs',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

// CLIENT: Submit payment using the preferred method saved in the booking.
router.post(
  '/',
  ...clientOnly,
  handlePaymentProofUpload,
  async (req, res) => {
    let uploadedAsset = null;

    try {
      const {
        bookingId,
        amount,
        referenceNumber
      } = req.body;

      if (
        !bookingId ||
        !mongoose.Types.ObjectId.isValid(bookingId) ||
        !amount ||
        !referenceNumber ||
        !req.file
      ) {
        return res.status(400).json({
          message: 'Please complete all payment details and upload proof of payment.'
        });
      }

      const paymentAmount = Number(amount);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({
          message: 'Please enter a valid payment amount.'
        });
      }

      // Find the booking owned by the logged-in client.
      const booking = await Booking.findOne({
        _id: bookingId,
        client: req.user._id
      });

      if (!booking) {
        return res.status(404).json({
          message: 'Booking not found.'
        });
      }

      if (booking.bookingStatus !== 'Approved') {
  return res.status(400).json({
    message: 'Payment can only be submitted after the Coordinator approves the booking.'
  });
}

      // Use the payment method selected during booking.
      // Older bookings may not have one saved yet, so accept it from the form once.
      const paymentMethod =
        booking.preferredPaymentMethod || req.body.paymentMethod;

      if (!['GCash', 'Maya', 'Bank Transfer', 'Cash'].includes(paymentMethod)) {
        return res.status(400).json({
          message: 'Please choose a payment method.'
        });
      }

      if (!booking.preferredPaymentMethod) {
        booking.preferredPaymentMethod = paymentMethod;
        await booking.save();
      }

      if (Number(booking.totalPrice || 0) <= 0) {
        return res.status(400).json({
          message: 'Please wait for the Coordinator to set the total event price.'
        });
      }

      // Calculate verified payments.
      const verifiedPayments = await Payment.aggregate([
        {
          $match: {
            booking: booking._id,
            verificationStatus: 'Verified'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const verifiedAmount =
        verifiedPayments.length > 0 ? verifiedPayments[0].total : 0;

      // Calculate pending payments to avoid exceeding the balance.
      const pendingPayments = await Payment.aggregate([
        {
          $match: {
            booking: booking._id,
            verificationStatus: 'Pending'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const pendingAmount =
        pendingPayments.length > 0 ? pendingPayments[0].total : 0;

      const remainingBalance =
        Number(booking.totalPrice) - verifiedAmount - pendingAmount;

      if (remainingBalance <= 0) {
        return res.status(400).json({
          message: 'There is no remaining balance available for payment.'
        });
      }

      if (paymentAmount > remainingBalance) {
        return res.status(400).json({
          message: 'Payment amount exceeds the remaining balance.'
        });
      }

      // Upload image only after validating the payment details.
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        throw new HttpError(503, 'Payment proof uploads are not configured on the server.');
      }

      uploadedAsset = await uploadPaymentProof(req.file.buffer);

      const payment = await Payment.create({
        booking: booking._id,
        client: req.user._id,
        amount: paymentAmount,
        paymentMethod,
        referenceNumber,
        proofOfPayment: uploadedAsset.secure_url,
        verificationStatus: 'Pending'
      });

      res.status(201).json({
        message: 'Payment submitted successfully! Waiting for Coordinator verification.',
        payment
      });
    } catch (error) {
      // Remove uploaded image if saving the payment failed.
      if (uploadedAsset?.public_id) {
        try {
          await cloudinary.uploader.destroy(uploadedAsset.public_id);
        } catch (cleanupError) {
          console.error('Cloudinary cleanup failed:', cleanupError.message);
        }
      }

      throw error;
    }
  }
);

// CLIENT: View own payment history.
router.get('/my-payments', ...clientOnly, async (req, res) => {
  try {
    const payments = await Payment.find({
      client: req.user._id
    })
      .populate(
        'booking',
        'eventName eventDate totalPrice amountPaid paymentStatus preferredPaymentMethod'
      )
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    throw error;
  }
});

// COORDINATOR: View all submitted payments.
router.get('/', ...coordinatorOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate(
        'booking',
        'clientName clientEmail eventName eventDate totalPrice preferredPaymentMethod'
      )
      .populate('client', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    throw error;
  }
});

// COORDINATOR: Verify or reject a submitted payment.
router.put('/:id/verify', ...coordinatorOnly, async (req, res) => {
  try {
    const { verificationStatus, coordinatorRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid payment ID.'
      });
    }

    if (!['Verified', 'Rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        message: 'Choose Verified or Rejected.'
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found.'
      });
    }

    if (payment.verificationStatus !== 'Pending') {
      return res.status(400).json({
        message: 'This payment has already been reviewed.'
      });
    }

    payment.verificationStatus = verificationStatus;
    payment.coordinatorRemarks = coordinatorRemarks || '';

    await payment.save();

    const updatedBooking = await updateBookingPaymentSummary(
      payment.booking
    );

    res.status(200).json({
      message: `Payment ${verificationStatus.toLowerCase()} successfully!`,
      payment,
      booking: updatedBooking
    });
  } catch (error) {
    throw error;
  }
});

module.exports = router;
