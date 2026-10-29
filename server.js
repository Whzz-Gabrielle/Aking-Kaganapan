const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

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

// API routes
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Start the API server first
app.listen(PORT, () => {
  console.log(`Aking Kaganapan API running at http://localhost:${PORT}`);

  // Connect to MongoDB separately
  connectDB().catch(() => {
    console.error(
      'MongoDB connection is unavailable. Database endpoints may not work.'
    );
  });
});
