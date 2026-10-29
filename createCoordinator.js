
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createCoordinator() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from your .env file.');
    }

    const fullName = process.env.COORDINATOR_NAME;
    const email = process.env.COORDINATOR_EMAIL?.trim().toLowerCase();
    const password = process.env.COORDINATOR_PASSWORD;

    if (!fullName || !email || !password) {
      throw new Error(
        'Please set COORDINATOR_NAME, COORDINATOR_EMAIL, and COORDINATOR_PASSWORD in .env.'
      );
    }

    if (password.length < 8) {
      throw new Error('Coordinator password must be at least 8 characters.');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const existingUser = await User.findOne({ email });


if (existingUser) {
  if (existingUser.role !== 'Coordinator') {
    throw new Error(
      'This email already belongs to a Client. Choose a different email.'
    );
  }

  existingUser.password = await bcrypt.hash(password, 12);
  await existingUser.save();

  console.log('Coordinator password updated successfully.');
  return;
}

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      fullName: fullName.trim(),
      email,
      password: hashedPassword,
      role: 'Coordinator',
    });

    console.log('Coordinator account created successfully.');
    console.log('Login email:', email);
    console.log('Use the password you set in your .env file.');
  } catch (error) {
    console.error('Coordinator setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createCoordinator();
