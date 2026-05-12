import jwt from 'jsonwebtoken';

/**
 * Signs a JWT containing the user's id and role.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} role - 'user' | 'organizer' | 'vendor' | 'admin'
 * @returns {string} Signed JWT token
 * @throws {Error} When JWT_SECRET is not configured
 */
const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d', algorithm: 'HS256' }
  );
};

export default generateToken;
