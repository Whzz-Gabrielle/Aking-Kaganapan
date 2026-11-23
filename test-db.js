
require('dotenv').config();

const mongoose = require('mongoose');

console.log('MONGO_URI loaded:', Boolean(process.env.MONGO_URI));
console.log('Node.js version:', process.version);
console.log('OpenSSL version:', process.versions.openssl);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000
})
  .then(async () => {
    console.log('MongoDB diagnostic test successful!');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    process.exit(1);
  });
