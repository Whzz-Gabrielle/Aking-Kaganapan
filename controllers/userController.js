const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { HttpError } = require('../middleware/errorMiddleware');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role
});

// Register a new client
const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (!fullName?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, 'Please complete all required fields.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters.');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new HttpError(409, 'Email is already registered.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'Client' // Coordinators are created with `npm run create-coordinator` only.
  });

  res.status(201).json({
    message: 'Registration successful.',
    user: publicUser(user)
  });
};

// Login an existing user
const loginUser = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email?.trim() || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Same message for "no such user" and "wrong password" so accounts can't be probed.
  const passwordMatches = user
    ? await bcrypt.compare(String(password), user.password)
    : false;

  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.status(200).json({
    message: 'Login successful.',
    token,
    user: publicUser(user)
  });
};

// Return the signed-in user. The frontend calls this on load to confirm the
// stored token is still valid and the role has not changed.
const getMe = async (req, res) => {
  res.status(200).json({ user: publicUser(req.user) });
};

module.exports = { registerUser, loginUser, getMe };
