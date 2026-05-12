import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import * as socketService from '../services/socketService.js';
import { sendEventApprovedEmail, sendEventRejectedEmail, sendVendorVerifiedEmail } from '../services/emailService.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a period string into a Mongoose $gte date filter.
 * Each branch creates a fresh Date to avoid mutation bugs.
 * @param {'today'|'week'|'month'|'year'|'all'} period
 * @returns {object} Mongoose filter object (empty = no date restriction)
 */
const buildDateFilter = (period) => {
  const now = new Date();
  switch (period) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { createdAt: { $gte: start } };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { createdAt: { $gte: start } };
    }
    case 'month': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { createdAt: { $gte: start } };
    }
    case 'year': {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { createdAt: { $gte: start } };
    }
    default:
      return {};
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Approve or reject a pending event; notifies organiser via Socket.IO
 * @route   PATCH /api/admin/events/:id/approve
 * @access  Admin only
 */
export const approveEvent = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'approved' or 'rejected'" });
    }

    if (status === 'rejected' && !rejectionReason?.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const event = await Event.findById(req.params.id).populate('organizerId', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only approve or reject pending events' });
    }

    event.status = status;
    if (status === 'rejected') event.rejectionReason = rejectionReason.trim();
    await event.save();

    try {
      if (status === 'approved') {
        socketService.emitEventApproved(event._id.toString(), event.organizerId._id.toString(), {
          title: event.title,
          status: 'approved',
        });
      } else {
        socketService.emitEventRejected(event._id.toString(), event.organizerId._id.toString(), rejectionReason);
      }
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    if (status === 'approved') {
      sendEventApprovedEmail(
        event.organizerId.email,
        event.organizerId.name,
        event.title,
        event.date
      ).catch(err => console.error('Approval email failed:', err.message));
    } else {
      sendEventRejectedEmail(
        event.organizerId.email,
        event.organizerId.name,
        event.title,
        rejectionReason
      ).catch(err => console.error('Rejection email failed:', err.message));
    }

    res.status(200).json({
      success: true,
      message: `Event ${status} successfully`,
      event,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all pending events sorted by age (oldest first = most urgent)
 * @route   GET /api/admin/events/pending
 * @access  Admin only
 */
export const getPendingEvents = async (req, res, next) => {
  try {
    const { sortBy = 'createdAt', order = 'asc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const sortField = ['createdAt', 'date'].includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = order === 'desc' ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find({ status: 'pending' })
        .populate('organizerId', 'name email phone createdAt')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments({ status: 'pending' }),
    ]);

    const now = Date.now();
    const enriched = events.map((ev) => {
      const daysWaiting = Math.floor((now - new Date(ev.createdAt)) / (1000 * 60 * 60 * 24));
      return { ...ev, daysWaiting, isUrgent: daysWaiting > 3 };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      events: enriched,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a vendor as verified so they can place bids
 * @route   PATCH /api/admin/vendors/:id/verify
 * @access  Admin only
 */
export const verifyVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.role !== 'vendor') {
      return res.status(400).json({ success: false, error: 'User must be a vendor to be verified' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Vendor is already verified' });
    }

    user.isVerified = true;
    await user.save();

    try {
      socketService.emitVendorVerified(user._id.toString(), {
        userName: user.name,
        message: 'Your vendor account has been verified. You can now bid on events!',
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    sendVendorVerifiedEmail(user.email, user.name)
      .catch(err => console.error('Verify email failed:', err.message));

    res.status(200).json({
      success: true,
      message: 'Vendor verified successfully',
      user: { name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove vendor verification and auto-reject their pending bids
 * @route   PATCH /api/admin/vendors/:id/unverify
 * @access  Admin only
 */
export const unverifyVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.role !== 'vendor') {
      return res.status(400).json({ success: false, error: 'User must be a vendor' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, error: 'Vendor is not currently verified' });
    }

    user.isVerified = false;
    await user.save();

    // Auto-reject all pending bids to prevent unverified vendor from winning work
    const result = await Bid.updateMany(
      { vendorId: user._id, status: 'pending' },
      { status: 'rejected', respondedAt: new Date() }
    );

    try {
      socketService.emitToUser(user._id.toString(), 'vendor:unverified', {
        message: 'Your vendor verification has been removed. Contact support for more information.',
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Vendor unverified successfully',
      rejectedBids: result.modifiedCount,
      user: { name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all users with role-based activity stats
 * @route   GET /api/admin/users
 * @access  Admin only
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, isVerified, sortBy = 'createdAt', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const allowed = ['createdAt', 'name', 'email'];
    const sortField = allowed.includes(sortBy) ? sortBy : 'createdAt';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ [sortField]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Batch-fetch stats for each role group to avoid N+1 queries
    const organizerIds = users.filter(u => u.role === 'organizer').map(u => u._id);
    const vendorIds    = users.filter(u => u.role === 'vendor').map(u => u._id);
    const userIds      = users.filter(u => u.role === 'user').map(u => u._id);

    const [eventCounts, bidCounts, bidAcceptedCounts, bookingCounts] = await Promise.all([
      organizerIds.length
        ? Event.aggregate([
            { $match: { organizerId: { $in: organizerIds } } },
            { $group: { _id: '$organizerId', count: { $sum: 1 } } },
          ])
        : [],
      vendorIds.length
        ? Bid.aggregate([
            { $match: { vendorId: { $in: vendorIds } } },
            { $group: { _id: '$vendorId', count: { $sum: 1 } } },
          ])
        : [],
      vendorIds.length
        ? Bid.aggregate([
            { $match: { vendorId: { $in: vendorIds }, status: 'accepted' } },
            { $group: { _id: '$vendorId', count: { $sum: 1 } } },
          ])
        : [],
      userIds.length
        ? Booking.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
          ])
        : [],
    ]);

    // Build lookup maps from aggregation results
    const toMap = (arr) => Object.fromEntries(arr.map(r => [r._id.toString(), r.count]));
    const eventMap       = toMap(eventCounts);
    const bidMap         = toMap(bidCounts);
    const bidAcceptedMap = toMap(bidAcceptedCounts);
    const bookingMap     = toMap(bookingCounts);

    const enriched = users.map((u) => {
      const id = u._id.toString();
      const extra = {};
      if (u.role === 'organizer') extra.eventsCreated  = eventMap[id]       ?? 0;
      if (u.role === 'vendor')    { extra.bidsSubmitted = bidMap[id] ?? 0; extra.bidsAccepted = bidAcceptedMap[id] ?? 0; }
      if (u.role === 'user')      extra.bookingsCount   = bookingMap[id]     ?? 0;
      return { ...u, ...extra };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users: enriched,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a user and cascade all related data (ban)
 * @route   DELETE /api/admin/users/:id
 * @access  Admin only
 */
export const deleteUser = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete admin accounts' });
    }

    session.startTransaction();

    if (user.role === 'organizer') {
      const events = await Event.find({ organizerId: user._id }).select('_id').session(session);
      const eventIds = events.map(e => e._id);

      if (eventIds.length) {
        await Promise.all([
          Booking.deleteMany({ eventId: { $in: eventIds } }, { session }),
          Bid.deleteMany({ eventId: { $in: eventIds } }, { session }),
          Notification.deleteMany({ relatedId: { $in: eventIds } }, { session }),
          Event.deleteMany({ _id: { $in: eventIds } }, { session }),
        ]);
      }
    }

    if (user.role === 'vendor') {
      await Bid.deleteMany({ vendorId: user._id }, { session });
    }

    if (user.role === 'user') {
      await Booking.deleteMany({ userId: user._id }, { session });
    }

    await Notification.deleteMany({ userId: user._id }, { session });
    await user.deleteOne({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully',
    });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Platform-wide analytics dashboard; all queries run in parallel
 * @route   GET /api/admin/analytics
 * @access  Admin only
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const dateFilter = buildDateFilter(period);

    const [
      totalUsers,
      usersByRoleRaw,
      totalEvents,
      eventsByStatusRaw,
      totalBookings,
      revenueRaw,
      totalBids,
      bidsByStatusRaw,
      recentUsers,
      recentEvents,
      topOrganizers,
      topVendors,
      pendingApprovals,
    ] = await Promise.all([
      User.countDocuments(dateFilter),

      User.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      Event.countDocuments(dateFilter),

      Event.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Booking.countDocuments(dateFilter),

      Booking.aggregate([
        { $match: { ...dateFilter, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      Bid.countDocuments(dateFilter),

      Bid.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      User.find(dateFilter).sort({ createdAt: -1 }).limit(10).select('name email role createdAt').lean(),

      Event.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('organizerId', 'name email')
        .select('title status date category createdAt')
        .lean(),

      Event.aggregate([
        { $group: { _id: '$organizerId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'organizer' } },
        { $unwind: '$organizer' },
        { $project: { eventCount: 1, 'organizer.name': 1, 'organizer.email': 1 } },
      ]),

      Bid.aggregate([
        { $match: { status: 'accepted' } },
        { $group: { _id: '$vendorId', acceptedBids: { $sum: 1 } } },
        { $sort: { acceptedBids: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } },
        { $unwind: '$vendor' },
        { $project: { acceptedBids: 1, 'vendor.name': 1, 'vendor.email': 1 } },
      ]),

      Event.countDocuments({ status: 'pending' }),
    ]);

    // Flatten aggregation arrays into plain objects
    const flattenCounts = (arr) =>
      Object.fromEntries(arr.map(r => [r._id, r.count]));

    res.status(200).json({
      success: true,
      period,
      overview: {
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue: revenueRaw[0]?.total ?? 0,
        totalBids,
        pendingApprovals,
      },
      usersByRole:    flattenCounts(usersByRoleRaw),
      eventsByStatus: flattenCounts(eventsByStatusRaw),
      bidsByStatus:   flattenCounts(bidsByStatusRaw),
      recentUsers,
      recentEvents,
      topOrganizers,
      topVendors,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Detailed event statistics — category distribution, capacity, pricing
 * @route   GET /api/admin/analytics/events
 * @access  Admin only
 */
export const getEventStatistics = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      byCategory,
      capacityStats,
      upcomingCount,
      pastCount,
      withRequirements,
    ] = await Promise.all([
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Event.aggregate([
        {
          $group: {
            _id: null,
            avgMaxAttendees: { $avg: '$maxAttendees' },
            avgCurrentAttendees: { $avg: '$currentAttendees' },
            avgTicketPrice: { $avg: '$ticketPrice' },
            totalCapacity: { $sum: '$maxAttendees' },
            totalAttendees: { $sum: '$currentAttendees' },
          },
        },
      ]),

      Event.countDocuments({ date: { $gt: now }, status: { $in: ['approved', 'live'] } }),
      Event.countDocuments({ date: { $lte: now } }),
      Event.countDocuments({ 'requirements.0': { $exists: true } }),
    ]);

    const capacity = capacityStats[0] ?? {};

    res.status(200).json({
      success: true,
      byCategory,
      capacity: {
        avgMaxAttendees: Math.round(capacity.avgMaxAttendees ?? 0),
        avgCurrentAttendees: Math.round(capacity.avgCurrentAttendees ?? 0),
        avgTicketPrice: Math.round(capacity.avgTicketPrice ?? 0),
        totalPlatformCapacity: capacity.totalCapacity ?? 0,
        totalRegisteredAttendees: capacity.totalAttendees ?? 0,
        overallOccupancyRate: capacity.totalCapacity
          ? Math.round((capacity.totalAttendees / capacity.totalCapacity) * 100)
          : 0,
      },
      counts: {
        upcomingApprovedOrLive: upcomingCount,
        past: pastCount,
        withRequirements,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Revenue report grouped by day, week, or month
 * @route   GET /api/admin/analytics/revenue
 * @access  Admin only
 */
export const getRevenueReport = async (req, res, next) => {
  try {
    const { groupBy = 'month' } = req.query;

    // Default: last 12 months
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; })();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const formatMap = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m' };
    const dateFormat = formatMap[groupBy] ?? '%Y-%m';

    const [revenueByPeriod, totals] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            bookedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$bookedAt' } },
            revenue: { $sum: '$totalAmount' },
            bookings: { $sum: 1 },
            tickets: { $sum: '$numberOfTickets' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            bookedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: '$numberOfTickets' },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      period: { startDate, endDate, groupBy },
      summary: totals[0]
        ? {
            totalRevenue: totals[0].totalRevenue,
            totalBookings: totals[0].totalBookings,
            totalTickets: totals[0].totalTickets,
            avgOrderValue: Math.round(totals[0].avgOrderValue),
          }
        : { totalRevenue: 0, totalBookings: 0, totalTickets: 0, avgOrderValue: 0 },
      chartData: revenueByPeriod,
    });
  } catch (err) {
    next(err);
  }
};
