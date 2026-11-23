const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {
  requireDb,
  notFound,
  errorHandler
} = require('./middleware/errorMiddleware');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing from your .env file. Server not started.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed browser origins (comma-separated in .env). Defaults to the Vite dev server.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Aking Kaganapan API!');
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Aking Kaganapan API is working!',
    status: 'success'
  });
});

// API routes (requireDb returns a clear 503 if MongoDB is not connected)
app.use('/api', requireDb);
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Must stay last: unknown routes, then every error thrown above.
app.use(notFound);
app.use(errorHandler);

// Log problems instead of letting one bad promise crash the whole API.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Start the API server first
app.listen(PORT, () => {
  console.log(`Aking Kaganapan API running at http://localhost:${PORT}`);

  // Connect to MongoDB separately
  connectDB().catch(() => {
    console.error(
      'MongoDB connection is unavailable. Database endpoints will return 503.'
    );
  });
});

module.exports = app;
