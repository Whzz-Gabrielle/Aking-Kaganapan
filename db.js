const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoSelectFamily: false,
      serverSelectionTimeoutMS: 30000, // Hihintayin ng 30 seconds bago sumuko
      socketTimeoutMS: 45000,          // I-keep alive ang socket
      maxPoolSize: 10                  // Max na connections
    });
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// I-handle ang mga biglaang disconnection para hindi mag-crash ang app
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = connectDB;