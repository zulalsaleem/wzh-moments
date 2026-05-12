import mongoose from 'mongoose';
import VendorProposal from '../models/VendorProposal.js';
import UserRequest from '../models/UserRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import * as socketService from '../services/socketService.js';
import { sendProposalReceivedEmail, sendProposalAcceptedEmail, sendProposalRejectedEmail } from '../services/emailService.js';

// ─── SUBMIT PROPOSAL ──────────────────────────────────────────────────────────
export const submitProposal = async (req, res, next) => {
  try {
    const {
      requestId,
      amount,
      proposal,
      deliveryTimeline,
      portfolioLinks,
      notes,
    } = req.body;

    // Validate required fields
    if (!requestId || !amount || !proposal || !deliveryTimeline) {
      return res.status(400).json({
        success: false,
        error: 'requestId, amount, proposal and deliveryTimeline are required',
      });
    }

    // Must be vendor role
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only vendors can submit proposals',
      });
    }

    // Must be verified vendor
    const vendor = await User.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor account not found',
      });
    }

    if (!vendor.isVerified && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Your vendor account must be verified by admin before submitting proposals. Please contact admin.',
      });
    }

    // Check request exists and is open
    const request = await UserRequest.findById(requestId)
      .populate('userId', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    if (request.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: `This request is ${request.status} and no longer accepting proposals`,
      });
    }

    // Vendor cannot propose on their own request
    if (request.userId._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot submit a proposal on your own request',
      });
    }

    // Check for duplicate proposal
    const existingProposal = await VendorProposal.findOne({
      vendorId: req.user.id,
      requestId,
    });

    if (existingProposal) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a proposal for this request',
      });
    }

    // Create the proposal
    const newProposal = await VendorProposal.create({
      requestId,
      vendorId: req.user.id,
      amount: Number(amount),
      proposal: proposal.trim(),
      deliveryTimeline: deliveryTimeline.trim(),
      portfolioLinks: Array.isArray(portfolioLinks)
        ? portfolioLinks.filter(l => l && l.trim())
        : [],
      notes: notes || '',
    });

    await UserRequest.findByIdAndUpdate(requestId, { $inc: { proposalsCount: 1 } });

    await newProposal.populate('vendorId', 'name email phone');

    try {
      socketService.emitToUser(request.userId._id.toString(), 'proposal:received', {
        proposalId: newProposal._id,
        requestId: request._id,
        requestTitle: request.title,
        vendorName: vendor.name,
        amount: newProposal.amount,
        message: `${vendor.name} sent a proposal for your request!`,
      });
    } catch (socketErr) {
      console.error('Socket notification failed:', socketErr.message);
    }

    try {
      await Notification.create({
        userId: request.userId._id,
        type: 'bid_received',
        title: 'New Proposal Received!',
        message: `${vendor.name} submitted a proposal of PKR ${amount} for "${request.title}"`,
        relatedId: newProposal._id,
        relatedModel: 'VendorProposal',
      });
    } catch (notifErr) {
      console.error('Notification save failed:', notifErr.message);
    }

    sendProposalReceivedEmail(
      request.userId.email,
      request.userId.name,
      request.title,
      vendor.name,
      Number(amount)
    ).catch(err => console.error('Proposal received email failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully! The user will be notified.',
      proposal: newProposal,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a proposal for this request',
      });
    }
    next(error);
  }
};

// ─── GET PROPOSALS FOR A REQUEST (request owner or admin) ────────────────────
export const getProposalsForRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await UserRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    // Only owner or admin can view proposals
    const requestOwnerId = request.userId.toString();
    const currentUserId = req.user.id || req.user._id?.toString();

    if (requestOwnerId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the request owner can view proposals',
      });
    }

    const proposals = await VendorProposal.find({ requestId })
      .populate('vendorId', 'name email phone isVerified createdAt bio')
      .sort({ createdAt: -1 });

    const stats = {
      total: proposals.length,
      pending: proposals.filter(p => p.status === 'pending').length,
      accepted: proposals.filter(p => p.status === 'accepted').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      lowestAmount: proposals.length > 0
        ? Math.min(...proposals.map(p => p.amount))
        : 0,
      highestAmount: proposals.length > 0
        ? Math.max(...proposals.map(p => p.amount))
        : 0,
      averageAmount: proposals.length > 0
        ? Math.round(
            proposals.reduce((s, p) => s + p.amount, 0) / proposals.length
          )
        : 0,
    };

    res.json({
      success: true,
      requestTitle: request.title,
      requestStatus: request.status,
      stats,
      proposals,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY PROPOSALS (vendor sees their own proposals) ───────────────────────
export const getMyProposals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { vendorId: req.user.id };
    if (status) filter.status = status;

    const proposals = await VendorProposal.find(filter)
      .populate({ path: 'requestId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await VendorProposal.countDocuments(filter);

    res.json({
      success: true,
      count: proposals.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      proposals,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ACCEPT PROPOSAL ──────────────────────────────────────────────────────────
export const acceptProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    const proposal = await VendorProposal.findById(proposalId)
      .populate('vendorId', 'name email')
      .populate('requestId');

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const request = proposal.requestId;

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only accept pending proposals' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Request is no longer open' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      proposal.status = 'accepted';
      proposal.respondedAt = new Date();
      await proposal.save({ session });

      request.status = 'assigned';
      request.assignedVendorId = proposal.vendorId._id;
      request.acceptedProposalId = proposal._id;
      await request.save({ session });

      await VendorProposal.updateMany(
        { requestId: request._id, _id: { $ne: proposal._id }, status: 'pending' },
        { status: 'rejected', respondedAt: new Date() },
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    try {
      socketService.emitToUser(proposal.vendorId._id.toString(), 'proposal:accepted', {
        proposalId: proposal._id,
        requestId: request._id,
        requestTitle: request.title,
        amount: proposal.amount,
        message: `Congratulations! Your proposal for "${request.title}" was accepted!`,
      });
    } catch (e) {
      console.error('Socket emit failed:', e.message);
    }

    try {
      await Notification.create({
        userId: proposal.vendorId._id,
        type: 'proposal_accepted',
        title: 'Proposal Accepted!',
        message: `Your proposal for "${request.title}" was accepted. Contact the user to proceed!`,
        relatedId: proposal._id,
        relatedModel: 'VendorProposal',
      });
    } catch (e) {
      console.error('Notification create failed:', e.message);
    }

    sendProposalAcceptedEmail(
      proposal.vendorId.email,
      proposal.vendorId.name,
      request.title,
      proposal.amount
    ).catch(err => console.error('Proposal accepted email failed:', err.message));

    res.json({
      success: true,
      message: 'Proposal accepted! Other proposals auto-rejected.',
      proposal,
    });
  } catch (error) {
    next(error);
  }
};

// ─── REJECT PROPOSAL ──────────────────────────────────────────────────────────
export const rejectProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    const proposal = await VendorProposal.findById(proposalId)
      .populate('vendorId', 'name email')
      .populate('requestId');

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const request = proposal.requestId;

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only reject pending proposals' });
    }

    proposal.status = 'rejected';
    proposal.respondedAt = new Date();
    await proposal.save();

    try {
      socketService.emitToUser(proposal.vendorId._id.toString(), 'proposal:rejected', {
        proposalId: proposal._id,
        requestId: request._id,
        requestTitle: request.title,
        message: `Your proposal for "${request.title}" was not selected.`,
      });
    } catch (e) {
      console.error('Socket emit failed:', e.message);
    }

    try {
      await Notification.create({
        userId: proposal.vendorId._id,
        type: 'proposal_rejected',
        title: 'Proposal Not Selected',
        message: `Your proposal for "${request.title}" was not selected this time.`,
        relatedId: proposal._id,
        relatedModel: 'VendorProposal',
      });
    } catch (e) {
      console.error('Notification create failed:', e.message);
    }

    sendProposalRejectedEmail(
      proposal.vendorId.email,
      proposal.vendorId.name,
      request.title
    ).catch(err => console.error('Proposal rejected email failed:', err.message));

    res.json({ success: true, message: 'Proposal rejected', proposal });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE PROPOSAL (vendor withdraws before accepted/rejected) ──────────────
export const deleteProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    const proposal = await VendorProposal.findById(proposalId);

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    if (proposal.vendorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only delete pending proposals' });
    }

    await proposal.deleteOne();

    await UserRequest.findByIdAndUpdate(proposal.requestId, { $inc: { proposalsCount: -1 } });

    res.json({ success: true, message: 'Proposal withdrawn successfully' });
  } catch (error) {
    next(error);
  }
};
