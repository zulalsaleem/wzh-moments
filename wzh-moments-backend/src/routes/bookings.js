import { Router } from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  getEventBookings,
  cancelBooking,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateBooking } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationHandler.js';

const router = Router();

// All booking routes require authentication
router.post(
  '/',
  protect,
  validateCreateBooking,
  handleValidationErrors,
  createBooking
);

// /me must be defined before /:id so Express doesn't treat "me" as an ObjectId
router.get('/me', protect, getUserBookings);

router.get(
  '/event/:eventId',
  protect,
  authorize('organizer', 'admin'),
  getEventBookings
);

router.get('/:id', protect, getBookingById);

router.delete('/:id', protect, cancelBooking);

export default router;
