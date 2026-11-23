const mongoose = require('mongoose');

// Throw this from any route or controller to send a specific status + message.
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}

// Reject requests early when MongoDB is not connected, instead of letting
// Mongoose buffer the query for 10 seconds and then fail with a vague error.
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  return res.status(503).json({
    message: 'The database is temporarily unavailable. Please try again in a moment.'
  });
};

// Unknown route.
const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

// One place that turns any error into a clean, consistent JSON response:
// { message: string, errors?: [{ field, message }] }
// Internal details are logged on the server and never sent to the browser.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    message = errors[0]?.message || 'Validation failed.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = field ? `That ${field} is already in use.` : 'Duplicate value.';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired. Please sign in again.';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    status = 401;
    message = 'Invalid login token. Please sign in again.';
  } else if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. The maximum size is 5 MB.'
        : 'File upload failed.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError'
  ) {
    status = 503;
    message = 'The database is temporarily unavailable. Please try again in a moment.';
  }

  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (status === 500) {
      message = 'Something went wrong on our side. Please try again.';
    }
    errors = undefined;
  }

  const body = { message };
  if (Array.isArray(errors) && errors.length) body.errors = errors;

  res.status(status).json(body);
};

// Validates :id route params so a bad ID returns 400 instead of a CastError.
const validateIdParam = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ message: 'Invalid ID.' });
  }
  next();
};

module.exports = { HttpError, requireDb, notFound, errorHandler, validateIdParam };
