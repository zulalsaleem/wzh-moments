import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verifies the Bearer token in the Authorization header and attaches the
 * authenticated user to req.user. Must precede any protected route handler.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restricts a route to one or more roles.
 * Must be used after `protect` so req.user is populated.
 *
 * @param {...string} roles - Allowed roles, e.g. authorize('organizer', 'admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `You must be ${roles.join(' or ')} to access this resource`,
      });
    }

    next();
  };
};
