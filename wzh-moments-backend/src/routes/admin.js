import { Router } from 'express';
import {
  approveEvent,
  getPendingEvents,
  verifyVendor,
  unverifyVendor,
  getAllUsers,
  deleteUser,
  getAnalytics,
  getEventStatistics,
  getRevenueReport,
} from '../controllers/adminController.js';
import { adminGetAllRequests, adminDeleteRequest } from '../controllers/userRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require the 'admin' role
router.use(protect, authorize('admin'));

// ─── Event management ─────────────────────────────────────────────────────────
// Static path must come before the parameterised route
router.get('/events/pending',       getPendingEvents);
router.patch('/events/:id/approve', approveEvent);

// ─── Vendor management ────────────────────────────────────────────────────────
router.patch('/vendors/:id/verify',   verifyVendor);
router.patch('/vendors/:id/unverify', unverifyVendor);

// ─── User management ──────────────────────────────────────────────────────────
router.get('/users',     getAllUsers);
router.delete('/users/:id', deleteUser);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics',          getAnalytics);
router.get('/analytics/events',   getEventStatistics);
router.get('/analytics/revenue',  getRevenueReport);

// ─── User requests moderation ─────────────────────────────────────────────────
router.get('/user-requests',        adminGetAllRequests);
router.delete('/user-requests/:id', adminDeleteRequest);

export default router;
