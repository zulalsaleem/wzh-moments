import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import * as socketService from '../services/socketService.js';

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Vendor submits a bid on an event requirement
 * @route   POST /api/bids
 * @access  Protected — vendor only
 */
export const createBid = async (req, res, next) => {
  try {
    const { eventId, requirementId, amount, proposal, deliveryTime, portfolioLinks = [] } = req.body;
    const vendorId = req.user.id;

    // Verified vendors only (SDD Algorithm 2, step 1)
    const vendor = await User.findById(vendorId).select('isVerified');
    if (!vendor.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Your vendor account must be verified by admin before bidding',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (['completed', 'cancelled'].includes(event.status)) {
      return res.status(400).json({ success: false, error: 'Cannot bid on completed or cancelled events' });
    }

    // Find the specific requirement inside the event's embedded array
    const requirement = event.requirements.id(requirementId);
    if (!requirement) {
      return res.status(404).json({ success: false, error: 'Requirement not found in this event' });
    }

    if (['assigned', 'completed'].includes(requirement.status)) {
      return res.status(400).json({ success: false, error: 'This requirement has already been assigned' });
    }

    // One vendor, one bid per requirement (SDD Algorithm 2, step 2)
    const existing = await Bid.findOne({ vendorId, eventId, requirementId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already submitted a bid for this requirement' });
    }

    const bid = await Bid.create({
      vendorId,
      eventId,
      requirementId,
      amount,
      proposal,
      deliveryTime,
      portfolioLinks,
      status: 'pending',
    });

    await bid.populate([
      { path: 'vendorId', select: 'name email profileImage bio' },
      { path: 'eventId', select: 'title organizerId' },
    ]);

    // Notify organiser in real-time (SDD Algorithm 2, step 4)
    try {
      socketService.emitBidReceived(event._id.toString(), event.organizerId.toString(), {
        bidId: bid._id,
        vendorName: req.user.name,
        vendorEmail: req.user.email,
        amount: bid.amount,
        requirementTitle: requirement.title,
        requirementId: requirement._id,
        totalBids: await Bid.countDocuments({ eventId, requirementId }),
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    // TODO: Persist notification for organiser
    // await notificationService.create({
    //   userId: event.organizerId,
    //   type: NOTIFICATION_TYPES.BID_RECEIVED,
    //   title: 'New bid received',
    //   message: `${req.user.name} bid ${amount} on ${requirement.title}`,
    //   relatedId: bid._id,
    //   relatedModel: 'Bid',
    // });

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      bid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all bids for an event, grouped by requirement (organiser / admin)
 * @route   GET /api/bids/event/:eventId
 * @access  Protected — organizer (own), admin (any)
 */
export const getEventBids = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const isOwner = event.organizerId.toString() === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view bids for this event' });
    }

    const { requirementId, status, sortBy } = req.query;

    const filter = { eventId: req.params.eventId };
    if (requirementId) filter.requirementId = requirementId;
    if (status) filter.status = status;

    // Sort: default newest first, or by amount
    const sort = sortBy === 'amount_asc'
      ? { amount: 1 }
      : sortBy === 'amount_desc'
        ? { amount: -1 }
        : { submittedAt: -1 };

    const bids = await Bid.find(filter)
      .populate('vendorId', 'name email profileImage bio isVerified')
      .sort(sort)
      .lean();

    // Group bids by requirement with stats
    const bidsByRequirement = {};
    for (const req of event.requirements) {
      const reqBids = bids.filter(b => b.requirementId.toString() === req._id.toString());
      const amounts = reqBids.map(b => b.amount);

      bidsByRequirement[req._id.toString()] = {
        requirement: req,
        bidsCount: reqBids.length,
        lowestBid: amounts.length ? Math.min(...amounts) : null,
        highestBid: amounts.length ? Math.max(...amounts) : null,
        averageBid: amounts.length
          ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length)
          : null,
        bids: reqBids,
      };
    }

    const stats = {
      totalBids: bids.length,
      pendingBids: bids.filter(b => b.status === 'pending').length,
      acceptedBids: bids.filter(b => b.status === 'accepted').length,
      rejectedBids: bids.filter(b => b.status === 'rejected').length,
      uniqueVendors: new Set(bids.map(b => b.vendorId._id.toString())).size,
    };

    res.status(200).json({
      success: true,
      eventTitle: event.title,
      stats,
      bidsByRequirement,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all bids submitted by the authenticated vendor
 * @route   GET /api/bids/vendor/my-bids
 * @access  Protected — vendor only
 */
export const getVendorBids = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { vendorId: req.user.id };
    if (status) filter.status = status;

    const [bids, total] = await Promise.all([
      Bid.find(filter)
        .populate('eventId', 'title date location status requirements organizerId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bid.countDocuments(filter),
    ]);

    const now = new Date();
    const enriched = bids.map((bid) => {
      const eventDate = bid.eventId?.date ? new Date(bid.eventId.date) : null;
      const requirement = bid.eventId?.requirements?.find(
        r => r._id.toString() === bid.requirementId.toString()
      );

      return {
        ...bid,
        requirementTitle: requirement?.title ?? null,
        isEventUpcoming: eventDate ? eventDate > now : false,
        canEdit: bid.status === 'pending',
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bids: enriched,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single bid (vendor's own, event organiser, or admin)
 * @route   GET /api/bids/:id
 * @access  Protected
 */
export const getBidById = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('vendorId', 'name email profileImage bio isVerified')
      .populate('eventId', 'title date location status organizerId requirements');

    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    const isVendor = bid.vendorId._id.toString() === req.user.id.toString();
    const isOrganizer = bid.eventId?.organizerId?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isVendor && !isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this bid' });
    }

    const requirement = bid.eventId?.requirements?.find(
      r => r._id.toString() === bid.requirementId.toString()
    );

    res.status(200).json({
      success: true,
      bid: { ...bid.toJSON(), requirement: requirement ?? null },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Accept or reject a bid; accepting auto-rejects all other bids on the same requirement
 * @route   PATCH /api/bids/:id/status
 * @access  Protected — organizer (own event), admin
 */
export const updateBidStatus = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'accepted' or 'rejected'" });
    }

    const bid = await Bid.findById(req.params.id)
      .populate('vendorId', 'name email')
      .populate('eventId', 'title organizerId requirements');

    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    const isOwner = bid.eventId.organizerId.toString() === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to respond to this bid' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only update pending bids' });
    }

    const requirement = bid.eventId.requirements.id(bid.requirementId);

    session.startTransaction();

    bid.status = status;
    bid.respondedAt = new Date();
    await bid.save({ session });

    let rejectedCount = 0;

    if (status === 'accepted') {
      // Mark requirement as assigned so no further bids can be submitted
      const event = await Event.findById(bid.eventId._id).session(session);
      const req = event.requirements.id(bid.requirementId);
      req.status = 'assigned';
      event.markModified('requirements');
      await event.save({ session });

      // Auto-reject every other pending bid on this requirement
      const result = await Bid.updateMany(
        {
          eventId: bid.eventId._id,
          requirementId: bid.requirementId,
          _id: { $ne: bid._id },
          status: 'pending',
        },
        { status: 'rejected', respondedAt: new Date() },
        { session }
      );
      rejectedCount = result.modifiedCount;
    }

    await session.commitTransaction();

    // Real-time notification to vendor
    try {
      if (status === 'accepted') {
        socketService.emitBidAccepted(bid.vendorId._id.toString(), {
          bidId: bid._id,
          eventTitle: bid.eventId.title,
          requirementTitle: requirement?.title,
          amount: bid.amount,
        });
      } else {
        socketService.emitBidRejected(bid.vendorId._id.toString(), {
          bidId: bid._id,
          eventTitle: bid.eventId.title,
          requirementTitle: requirement?.title,
        });
      }
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    // TODO: Persist notification for vendor
    // await notificationService.create({
    //   userId: bid.vendorId._id,
    //   type: status === 'accepted' ? NOTIFICATION_TYPES.BID_ACCEPTED : NOTIFICATION_TYPES.BID_REJECTED,
    //   title: status === 'accepted' ? 'Bid accepted!' : 'Bid not selected',
    //   message: status === 'accepted'
    //     ? `Your bid for ${requirement?.title} was accepted.`
    //     : `Your bid for ${requirement?.title} was not selected.`,
    //   relatedId: bid._id,
    //   relatedModel: 'Bid',
    // });

    res.status(200).json({
      success: true,
      message: `Bid ${status} successfully`,
      bid,
      ...(status === 'accepted' && { rejectedBids: rejectedCount }),
    });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Vendor withdraws a pending bid
 * @route   DELETE /api/bids/:id
 * @access  Protected — vendor (own bids only)
 */
export const deleteBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    if (bid.vendorId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this bid' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only delete pending bids' });
    }

    await bid.deleteOne();

    res.status(200).json({ success: true, message: 'Bid deleted successfully' });
  } catch (err) {
    next(err);
  }
};
