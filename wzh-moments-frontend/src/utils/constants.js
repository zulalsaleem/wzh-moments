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
  { value: 'wedding', label: 'Wedding' },
  { value: 'conference', label: 'Conference' },
  { value: 'concert', label: 'Concert' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'party', label: 'Party' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'sports', label: 'Sports' },
  { value: 'charity', label: 'Charity' },
  { value: 'other', label: 'Other' },
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

export const REQUEST_CATEGORIES = [
  { value: 'birthday_party',  label: '🎂 Birthday Party' },
  { value: 'wedding_setup',   label: '💍 Wedding Setup' },
  { value: 'corporate_event', label: '🏢 Corporate Event' },
  { value: 'photography',     label: '📸 Photography' },
  { value: 'catering',        label: '🍽️ Catering' },
  { value: 'decoration',      label: '🎨 Decoration' },
  { value: 'sound_system',    label: '🎵 Sound System' },
  { value: 'venue_booking',   label: '🏛️ Venue Booking' },
  { value: 'entertainment',   label: '🎭 Entertainment' },
  { value: 'other',           label: '📋 Other' },
];

export const REQUEST_STATUS_COLORS = {
  open:      'bg-green-100 text-green-800',
  assigned:  'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const PROPOSAL_STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
