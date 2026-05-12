import { body } from 'express-validator';
import { EVENT_CATEGORIES } from './constants.js';

// ─── Auth validators ───────────────────────────────────────────────────────────

/**
 * Validation chain for POST /api/auth/register.
 * Admin accounts are created out-of-band — 'admin' is excluded from the role enum.
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters and contain only letters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name must be 2-50 characters and contain only letters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters with letters and numbers')
    .matches(/[a-zA-Z]/).withMessage('Password must be at least 6 characters with letters and numbers')
    .matches(/[0-9]/).withMessage('Password must be at least 6 characters with letters and numbers'),

  body('role')
    .optional()
    .isIn(['user', 'organizer', 'vendor']).withMessage('Invalid role selected'),

  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Please provide a valid phone number'),
];

/**
 * Validation chain for POST /api/auth/login.
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

/**
 * Validation chain for PUT /api/auth/password.
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters with letters and numbers')
    .matches(/[a-zA-Z]/).withMessage('New password must be at least 6 characters with letters and numbers')
    .matches(/[0-9]/).withMessage('New password must be at least 6 characters with letters and numbers')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

// ─── Event validators ──────────────────────────────────────────────────────────

/**
 * Validation chain for POST /api/events.
 */
export const validateEventCreate = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Event title must be 3-100 characters'),

  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),

  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Event date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required and must be under 200 characters')
    .isLength({ max: 200 }).withMessage('Location is required and must be under 200 characters'),

  body('category')
    .notEmpty().withMessage('Event category is required')
    .isIn(EVENT_CATEGORIES).withMessage('Invalid event category'),

  body('maxAttendees')
    .notEmpty().withMessage('Max attendees is required')
    .isInt({ min: 1, max: 100000 }).withMessage('Max attendees must be between 1 and 100,000'),

  body('timeline')
    .optional()
    .isArray().withMessage('Timeline must be an array')
    .custom((items) => {
      for (const item of items) {
        if (!item.task || typeof item.task !== 'string' || item.task.trim().length < 3) {
          throw new Error('Each timeline task must have a task name of at least 3 characters');
        }
      }
      return true;
    }),

  body('requirements')
    .optional()
    .isArray().withMessage('Requirements must be an array'),

  body('ticketPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ticket price must be 0 or greater'),
];

/**
 * Validation chain for PUT /api/events/:id — all fields optional.
 */
export const validateEventUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Event title must be 3-100 characters'),

  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Event date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must be under 200 characters'),

  body('category')
    .optional()
    .isIn(EVENT_CATEGORIES).withMessage('Invalid event category'),

  body('maxAttendees')
    .optional()
    .isInt({ min: 1, max: 100000 }).withMessage('Max attendees must be between 1 and 100,000'),

  body('ticketPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ticket price must be 0 or greater'),
];

// ─── Booking validators ────────────────────────────────────────────────────────

/**
 * Validation chain for POST /api/bookings.
 */
export const validateCreateBooking = [
  body('eventId')
    .notEmpty().withMessage('Valid event ID is required')
    .isMongoId().withMessage('Valid event ID is required'),

  body('numberOfTickets')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Number of tickets must be between 1 and 50'),
];

// ─── Bid validators ────────────────────────────────────────────────────────────

/**
 * Validation chain for POST /api/bids.
 */
export const validateCreateBid = [
  body('eventId')
    .notEmpty().withMessage('Valid event ID is required')
    .isMongoId().withMessage('Valid event ID is required'),

  body('requirementId')
    .notEmpty().withMessage('Valid requirement ID is required')
    .isMongoId().withMessage('Valid requirement ID is required'),

  body('amount')
    .notEmpty().withMessage('Bid amount must be a positive number')
    .isFloat({ min: 0 }).withMessage('Bid amount must be a positive number'),

  body('proposal')
    .trim()
    .notEmpty().withMessage('Proposal must be 20-1000 characters describing your service')
    .isLength({ min: 20, max: 1000 }).withMessage('Proposal must be 20-1000 characters describing your service'),

  body('deliveryTime')
    .trim()
    .notEmpty().withMessage('Delivery time is required')
    .isLength({ max: 50 }).withMessage('Delivery time must be under 50 characters'),

  body('portfolioLinks')
    .optional()
    .isArray({ max: 5 }).withMessage('Portfolio links must be valid URLs (max 5)')
    .custom((links) => {
      for (const link of links) {
        try {
          new URL(link);
        } catch {
          throw new Error('Portfolio links must be valid URLs (max 5)');
        }
      }
      return true;
    }),
];

/**
 * Validation chain for PATCH /api/events/:id/timeline.
 */
export const validateTimelineUpdate = [
  body('taskIndex')
    .notEmpty().withMessage('Valid task index is required')
    .isInt({ min: 0 }).withMessage('Valid task index is required'),

  body('completed')
    .notEmpty().withMessage('Completion status must be true or false')
    .isBoolean().withMessage('Completion status must be true or false'),
];
