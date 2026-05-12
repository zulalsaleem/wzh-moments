import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Bid from '../models/Bid.js';
import Notification from '../models/Notification.js';
import { EVENT_STATUS } from '../utils/constants.js';
import * as socketService from '../services/socketService.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a Mongoose sort object from query params. */
const buildSort = (sort = 'date', order = 'asc') => {
  const allowed = ['date', 'createdAt', 'title'];
  const field = allowed.includes(sort) ? sort : 'date';
  return { [field]: order === 'desc' ? -1 : 1 };
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Create a new event (status: pending, awaits admin approval)
 * @route   POST /api/events
 * @access  Protected — organizer, admin
 */
export const createEvent = async (req, res, next) => {
  try {
    const {
      title, description, date, location, category,
      maxAttendees, timeline = [], requirements = [],
      ticketPrice = 0, imageUrl, tags = [],
    } = req.body;

    // Normalise timeline: auto-assign order, reset completion state
    const normalisedTimeline = timeline.map((item, i) => ({
      task: item.task,
      description: item.description,
      order: item.order ?? i + 1,
      completed: false,
      completedAt: null,
    }));

    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      timeline: normalisedTimeline,
      requirements,
      ticketPrice,
      imageUrl,
      tags,
      organizerId: req.user.id,
      status: EVENT_STATUS.PENDING,
      currentAttendees: 0,
    });

    await event.populate('organizerId', 'name email');

    // TODO: Notify all admin users of the new pending event
    // const admins = await User.find({ role: 'admin' }).select('_id');
    // await notificationService.createBulk(admins, {
    //   type: NOTIFICATION_TYPES.EVENT_CREATED,
    //   title: 'New event pending approval',
    //   message: `${req.user.name} created event: ${title}`,
    //   relatedId: event._id,
    //   relatedModel: 'Event',
    // });

    res.status(201).json({
      success: true,
      message: 'Event created successfully. Waiting for admin approval.',
      event,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all events with filtering, search, and pagination
 * @route   GET /api/events
 * @access  Public
 */
export const getEvents = async (req, res, next) => {
  try {
    const {
      status = 'approved',
      category,
      organizerId,
      search,
      sort,
      order,
    } = req.query;

    let page = Math.max(1, parseInt(req.query.page) || 1);
    let limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // ── Filter ────────────────────────────────────────────────────────────────
    const filter = { status };
    if (category) filter.category = category;
    if (organizerId) filter.organizerId = organizerId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Query ─────────────────────────────────────────────────────────────────
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizerId', 'name email profileImage')
        .sort(buildSort(sort, order))
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      events,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single event by ID with booking count and derived fields
 * @route   GET /api/events/:id
 * @access  Public
 */
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name email profileImage bio phone');

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const bookingsCount = await Booking.countDocuments({ eventId: event._id });

    // Use toObject() so the populated organizerId keeps its _id field intact
    // (toJSON() would apply the User transform that renames _id → id, breaking
    // the frontend's organizer identity check)
    const eventObj = event.toObject();

    // Alias so the frontend can read event.organizer._id reliably
    eventObj.organizer = eventObj.organizerId;

    res.status(200).json({
      success: true,
      event: {
        ...eventObj,
        bookingsCount,
        availableSeats: event.maxAttendees - event.currentAttendees,
        completionPercentage: event.completionPercentage,
        isUpcoming: event.date > new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update event details (not status or timeline — those have own routes)
 * @route   PUT /api/events/:id
 * @access  Protected — organizer (own), admin (any)
 */
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const isOwner = event.organizerId.toString() === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this event' });
    }

    const allowed = [
      'title', 'description', 'date', 'location', 'category',
      'maxAttendees', 'imageUrl', 'ticketPrice', 'tags',
    ];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    }

    // Guard: cannot shrink capacity below confirmed attendee count
    if (req.body.maxAttendees !== undefined && event.maxAttendees < event.currentAttendees) {
      return res.status(400).json({
        success: false,
        error: `Max attendees cannot be less than current bookings (${event.currentAttendees})`,
      });
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete event and cascade-delete all related bookings, bids, notifications
 * @route   DELETE /api/events/:id
 * @access  Protected — organizer (own), admin (any)
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const isOwner = event.organizerId.toString() === req.user.id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this event' });
    }

    if ([EVENT_STATUS.LIVE, EVENT_STATUS.COMPLETED].includes(event.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete live or completed events. Please cancel first.',
      });
    }

    // Cascade delete — run in parallel for performance
    await Promise.all([
      Booking.deleteMany({ eventId: event._id }),
      Bid.deleteMany({ eventId: event._id }),
      Notification.deleteMany({ relatedId: event._id }),
    ]);

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event and all related data deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle a timeline task's completion (core real-time feature)
 * @route   PATCH /api/events/:id/timeline
 * @access  Protected — organizer (own event only)
 */
export const updateTimeline = async (req, res, next) => {
  try {
    const { taskIndex, completed } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this event timeline' });
    }

    if (!event.timeline[taskIndex]) {
      return res.status(400).json({ success: false, error: 'Invalid task index' });
    }

    event.timeline[taskIndex].completed = completed;
    event.timeline[taskIndex].completedAt = completed ? new Date() : null;
    event.markModified('timeline');

    await event.save();

    const completionPercentage = event.completionPercentage;
    const updatedTask = {
      index: taskIndex,
      task: event.timeline[taskIndex].task,
      completed: event.timeline[taskIndex].completed,
      completedAt: event.timeline[taskIndex].completedAt,
    };

    // Broadcast real-time progress — wrapped so a socket failure never breaks the REST response
    try {
      socketService.emitProgressUpdate(event._id.toString(), {
        eventId: event._id,
        timeline: event.timeline,
        updatedTask,
        completionPercentage,
        timestamp: new Date(),
      });
    } catch (socketErr) {
      console.error('Socket.IO emit failed (non-fatal):', socketErr.message);
    }

    // TODO: Create timeline_update notifications for all users who booked this event
    // const bookings = await Booking.find({ eventId: event._id }).select('userId');
    // await notificationService.createBulk(bookings.map(b => b.userId), { ... });

    res.status(200).json({
      success: true,
      message: 'Timeline updated successfully',
      event,
      completionPercentage,
      updatedTask,
    });
  } catch (err) {
    next(err);
  }
};
