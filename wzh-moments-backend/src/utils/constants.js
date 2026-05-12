export const USER_ROLES = {
  USER: 'user',
  ORGANIZER: 'organizer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
};

export const EVENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const EVENT_CATEGORIES = [
  'wedding',
  'conference',
  'concert',
  'corporate',
  'party',
  'seminar',
  'workshop',
  'sports',
  'charity',
  'other',
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const NOTIFICATION_TYPES = {
  EVENT_CREATED: 'event_created',
  EVENT_APPROVED: 'event_approved',
  EVENT_REJECTED: 'event_rejected',
  EVENT_UPDATED: 'event_updated',
  BOOKING_CREATED: 'booking_created',
  BOOKING_CANCELLED: 'booking_cancelled',
  BID_RECEIVED: 'bid_received',
  BID_ACCEPTED: 'bid_accepted',
  BID_REJECTED: 'bid_rejected',
  TIMELINE_UPDATE: 'timeline_update',
  REQUIREMENT_POSTED: 'requirement_posted',
  VENDOR_VERIFIED: 'vendor_verified',
};
