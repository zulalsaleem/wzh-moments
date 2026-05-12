import { Router } from 'express';
import {
  createBid,
  getEventBids,
  getVendorBids,
  getBidById,
  updateBidStatus,
  deleteBid,
} from '../controllers/bidController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateBid } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationHandler.js';

const router = Router();

router.post(
  '/',
  protect,
  authorize('vendor'),
  validateCreateBid,
  handleValidationErrors,
  createBid
);

// Static sub-paths must come before /:id to avoid route shadowing
router.get('/event/:eventId', protect, authorize('organizer', 'admin'), getEventBids);
router.get('/vendor/my-bids',  protect, authorize('vendor'), getVendorBids);

router.get('/:id',           protect, getBidById);
router.patch('/:id/status',  protect, authorize('organizer', 'admin'), updateBidStatus);
router.delete('/:id',        protect, authorize('vendor'), deleteBid);

export default router;
