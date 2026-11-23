const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if the request has a valid login token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Please log in to access this resource.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User account not found. Please sign in again.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Token problems -> 401. Anything else (e.g. database down) goes to the
    // central error handler so it is reported as a server error, not a bad login.
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        message:
          error.name === 'TokenExpiredError'
            ? 'Your session has expired. Please sign in again.'
            : 'Invalid login token. Please sign in again.'
      });
    }

    return next(error);
  }
};

// Allow only users with the required role
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};

module.exports = { protect, allowRoles };
