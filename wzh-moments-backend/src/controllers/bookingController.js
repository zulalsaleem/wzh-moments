import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import * as socketService from '../services/socketService.js';
import { sendBookingConfirmationEmail, sendBookingCancelledEmail } from '../services/emailService.js';
import { EVENT_STATUS } from '../utils/constants.js';

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Book tickets for an event (atomic — uses a MongoDB transaction)
 * @route   POST /api/bookings
 * @access  Protected — any authenticated user
 */
export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { eventId, numberOfTickets = 1 } = req.body;
    const userId = req.user.id;

    // ── Pre-flight checks (outside transaction — read-only) ───────────────────
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const bookableStatuses = [EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE];
    if (!bookableStatuses.includes(event.status)) {
      return res.status(400).json({ success: false, error: 'Event is not available for booking' });
    }

    if (event.date <= new Date()) {
      return res.status(400).json({ success: false, error: 'Cannot book past events' });
    }

    const existing = await Booking.findOne({ userId, eventId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already booked this event' });
    }

    const availableSeats = event.maxAttendees - event.currentAttendees;
    if (availableSeats === 0) {
      return res.status(400).json({ success: false, error: 'Event is fully booked' });
    }
    if (numberOfTickets > availableSeats) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available. You requested ${numberOfTickets} ticket${numberOfTickets === 1 ? '' : 's'}.`,
      });
    }

    const totalAmount = event.ticketPrice * numberOfTickets;

    // ── Atomic transaction ────────────────────────────────────────────────────
    session.startTransaction();

    const [booking] = await Booking.create(
      [{
        userId,
        eventId,
        numberOfTickets,
        totalAmount,
        status: 'confirmed',
        paymentStatus: totalAmount === 0 ? 'completed' : 'pending',
      }],
      { session }
    );

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { currentAttendees: numberOfTickets } },
      { new: true, session }
    );

    await session.commitTransaction();

    // ── Populate for response ─────────────────────────────────────────────────
    await booking.populate([
      { path: 'userId', select: 'name email' },
      { path: 'eventId', select: 'title date location organizerId' },
    ]);

    // ── Real-time notifications ───────────────────────────────────────────────
    try {
      socketService.emitNewBooking(eventId.toString(), {
        eventId: eventId.toString(),
        userId: userId.toString(),
        userName: req.user.name,
        numberOfTickets,
        currentAttendees: updatedEvent.currentAttendees,
        maxAttendees: updatedEvent.maxAttendees,
      });

      socketService.emitToUser(updatedEvent.organizerId.toString(), 'booking:new', {
        bookingId: booking._id,
        eventTitle: updatedEvent.title,
        userName: req.user.name,
        numberOfTickets,
        totalAmount,
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    sendBookingConfirmationEmail(
      req.user.email,
      req.user.name,
      event.title,
      event.date,
      event.location,
      numberOfTickets,
      totalAmount
    ).catch(err => console.error('Booking email failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Event booked successfully',
      booking,
      availableSeats: updatedEvent.maxAttendees - updatedEvent.currentAttendees,
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get all bookings for the authenticated user, with optional filters
 * @route   GET /api/bookings/me
 * @access  Protected
 */
export const getUserBookings = async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    // For upcoming filter: narrow to events with a future date first
    if (upcoming === 'true') {
      const futureEventIds = await Event.find({ date: { $gt: new Date() } }).distinct('_id');
      filter.eventId = { $in: futureEventIds };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate({
          path: 'eventId',
          populate: { path: 'organizerId', select: 'name email' },
        })
        .sort({ bookedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const now = new Date();
    const enriched = bookings.map((b) => {
      const eventDate = b.eventId?.date ? new Date(b.eventId.date) : null;
      const isUpcoming = eventDate ? eventDate > now : false;
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysUntilEvent = eventDate && isUpcoming
        ? Math.ceil((eventDate - now) / msPerDay)
        : 0;

      return {
        ...b,
        isUpcoming,
        daysUntilEvent,
        canCancel: isUpcoming && b.status === 'confirmed',
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bookings: enriched,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single booking (owner, event organiser, or admin)
 * @route   GET /api/bookings/:id
 * @access  Protected
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate({
        path: 'eventId',
        populate: { path: 'organizerId', select: '_id name email' },
      });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const isOwner = booking.userId._id.toString() === req.user.id.toString();
    const isEventOrganizer =
      booking.eventId?.organizerId?._id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all bookings for an event with revenue stats (organiser / admin only)
 * @route   GET /api/bookings/event/:eventId
 * @access  Protected — organizer (own), admin (any)
 */
export const getEventBookings = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const isOwner = event.organizerId.toString() === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view bookings for this event',
      });
    }

    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { eventId: req.params.eventId };
    if (status) filter.status = status;

    // Stats aggregation runs over ALL bookings (not paginated subset)
    const [statsResult, bookings, total] = await Promise.all([
      Booking.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(req.params.eventId) } },
        {
          $group: {
            _id: null,
            totalTicketsSold: { $sum: '$numberOfTickets' },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalAmount', 0],
              },
            },
            confirmedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            totalBookings: { $sum: 1 },
          },
        },
      ]),
      Booking.find(filter)
        .populate('userId', 'name email phone')
        .sort({ bookedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const stats = statsResult[0] ?? {
      totalBookings: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      confirmedCount: 0,
      cancelledCount: 0,
    };

    res.status(200).json({
      success: true,
      eventTitle: event.title,
      stats: {
        totalBookings: stats.totalBookings,
        totalTicketsSold: stats.totalTicketsSold,
        totalRevenue: stats.totalRevenue,
        confirmedBookings: stats.confirmedCount,
        cancelledBookings: stats.cancelledCount,
      },
      count: bookings.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel a booking and atomically release the seats
 * @route   DELETE /api/bookings/:id
 * @access  Protected — booking owner only
 */
export const cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title date organizerId maxAttendees currentAttendees');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    if (booking.eventId.date < new Date()) {
      return res.status(400).json({ success: false, error: 'Cannot cancel past event bookings' });
    }

    // ── Atomic transaction ────────────────────────────────────────────────────
    session.startTransaction();

    booking.status = 'cancelled';
    await booking.save({ session });

    const updatedEvent = await Event.findByIdAndUpdate(
      booking.eventId._id,
      { $inc: { currentAttendees: -booking.numberOfTickets } },
      { new: true, session }
    );

    await session.commitTransaction();

    // ── Real-time notifications ───────────────────────────────────────────────
    try {
      socketService.emitToUser(booking.eventId.organizerId.toString(), 'booking:cancelled', {
        bookingId: booking._id,
        eventTitle: booking.eventId.title,
        userName: req.user.name,
        numberOfTickets: booking.numberOfTickets,
      });

      socketService.emitBookingCancelled(booking.eventId._id.toString(), {
        currentAttendees: updatedEvent.currentAttendees,
        maxAttendees: updatedEvent.maxAttendees,
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    sendBookingCancelledEmail(
      req.user.email,
      req.user.name,
      booking.eventId.title
    ).catch(err => console.error('Cancel email failed:', err.message));

    res.status(200).json({
      success: true,
      message: `Booking cancelled successfully. ${booking.numberOfTickets} seat${booking.numberOfTickets === 1 ? '' : 's'} released.`,
      booking,
      refundAmount: booking.totalAmount,
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};
