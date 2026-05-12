/**
 * Central Express error-handling middleware.
 * Normalises Mongoose, JWT, and application errors into a consistent JSON shape.
 * Must be registered LAST in server.js (after all routes).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // ── Mongoose validation error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details,
    });
  }

  // ── Mongoose duplicate key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? 'Field';
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    return res.status(400).json({
      success: false,
      error: `${label} already exists`,
    });
  }

  // ── Mongoose bad ObjectId cast ─────────────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
    });
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }

  // ── Default ───────────────────────────────────────────────────────────────
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server error',
  });
};

export default errorHandler;
