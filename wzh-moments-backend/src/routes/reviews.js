import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  submitReview,
  getVendorReviews,
  canReviewVendor,
  getMyReviews,
  respondToReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', protect, authorize('user', 'organizer', 'admin'), submitReview);
router.get('/vendor/:vendorId', getVendorReviews);
router.get('/can-review/:vendorId', protect, canReviewVendor);
router.get('/my-reviews', protect, getMyReviews);
router.patch('/:id/respond', protect, authorize('vendor', 'organizer', 'admin'), respondToReview);
router.delete('/:id', protect, deleteReview);

export default router;
