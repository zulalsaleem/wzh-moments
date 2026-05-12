import { Router } from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateTimeline,
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validateEventCreate,
  validateEventUpdate,
  validateTimelineUpdate,
} from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationHandler.js';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/',    getEvents);
router.get('/:id', getEventById);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  validateEventCreate,
  handleValidationErrors,
  createEvent
);

router.put(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  validateEventUpdate,
  handleValidationErrors,
  updateEvent
);

router.delete(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  deleteEvent
);

router.patch(
  '/:id/timeline',
  protect,
  authorize('organizer'),
  validateTimelineUpdate,
  handleValidationErrors,
  updateTimeline
);

export default router;
