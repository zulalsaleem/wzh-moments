import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';
import {
  createUserRequest,
  getAllUserRequests,
  getUserRequestById,
  getMyRequests,
  cancelUserRequest,
  markRequestCompleted,
} from '../controllers/userRequestController.js';
import {
  submitProposal,
  getProposalsForRequest,
  getMyProposals,
  acceptProposal,
  rejectProposal,
  deleteProposal,
} from '../controllers/vendorProposalController.js';

const router = express.Router();

// ─── PUBLIC ROUTES (no auth needed) ──────────────────────────────
// Anyone can browse open requests
router.get('/', protect, getAllUserRequests);

// ─── STATIC ROUTES FIRST (before :id param routes) ───────────────

// User: get their own requests
router.get('/my-requests', protect, getMyRequests);

// Vendor: get their own proposals
router.get(
  '/my-proposals',
  protect,
  authorize('vendor', 'admin'),
  getMyProposals
);

// Vendor: submit a proposal
router.post(
  '/proposals/submit',
  protect,
  authorize('vendor', 'admin'),
  submitProposal
);

// Accept proposal (request owner)
router.patch(
  '/proposals/:proposalId/accept',
  protect,
  acceptProposal
);

// Reject proposal (request owner)
router.patch(
  '/proposals/:proposalId/reject',
  protect,
  rejectProposal
);

// Withdraw proposal (vendor only)
router.delete(
  '/proposals/:proposalId',
  protect,
  authorize('vendor', 'admin'),
  deleteProposal
);

// ─── PARAM ROUTES LAST (to avoid conflicts) ───────────────────────

// Get single request by ID
router.get('/:id', protect, getUserRequestById);

// Create new request (any authenticated user)
router.post('/', protect, createUserRequest);

// Cancel request (owner only)
router.delete('/:id', protect, cancelUserRequest);

// Mark completed (owner only)
router.patch('/:id/complete', protect, markRequestCompleted);

// Get proposals for a specific request (owner + admin)
router.get(
  '/:requestId/proposals',
  protect,
  getProposalsForRequest
);

export default router;
