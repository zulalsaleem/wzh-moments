import { getIO } from '../config/socket.js';

/**
 * Broadcasts a timeline task change to every client watching the event room.
 * Called from updateTimeline controller after the DB write succeeds.
 *
 * @param {string} eventId
 * @param {{ eventId, timeline, updatedTask, completionPercentage, timestamp }} updateData
 * @returns {boolean}
 */
export const emitProgressUpdate = (eventId, updateData) => {
  const io = getIO();

  io.to(`event-${eventId}`).emit('progress:update', {
    eventId: updateData.eventId,
    timeline: updateData.timeline,
    updatedTask: updateData.updatedTask,
    completionPercentage: updateData.completionPercentage,
    timestamp: updateData.timestamp ?? new Date(),
  });

  console.log(`📊 Progress update emitted for event: ${eventId}`);
  return true;
};

/**
 * Notifies every client in an event room that a new booking was made.
 * Useful for showing a live "seats remaining" counter on the event page.
 *
 * @param {string} eventId
 * @param {{ eventId, userId, userName, numberOfTickets, currentAttendees, maxAttendees }} bookingData
 * @returns {boolean}
 */
export const emitNewBooking = (eventId, bookingData) => {
  const io = getIO();

  io.to(`event-${eventId}`).emit('booking:created', {
    eventId: bookingData.eventId,
    userId: bookingData.userId,
    userName: bookingData.userName,
    numberOfTickets: bookingData.numberOfTickets,
    currentAttendees: bookingData.currentAttendees,
    maxAttendees: bookingData.maxAttendees,
    availableSeats: bookingData.maxAttendees - bookingData.currentAttendees,
    timestamp: new Date(),
  });

  console.log(`🎫 Booking notification emitted for event: ${eventId}`);
  return true;
};

/**
 * Sends a bid notification to the organiser's personal room and a count
 * update to the event room.
 *
 * @param {string} eventId
 * @param {string} organizerId
 * @param {{ bidId, vendorName, amount, requirementTitle, totalBids }} bidData
 * @returns {boolean}
 */
export const emitBidReceived = (eventId, organizerId, bidData) => {
  const io = getIO();

  // Targeted — only the organiser sees the full bid detail
  io.to(`user-${organizerId}`).emit('bid:received', {
    eventId,
    bidId: bidData.bidId,
    vendorName: bidData.vendorName,
    amount: bidData.amount,
    requirementTitle: bidData.requirementTitle,
    timestamp: new Date(),
  });

  // Broadcast — anyone watching the event sees the updated bid count
  io.to(`event-${eventId}`).emit('bid:posted', {
    eventId,
    bidCount: bidData.totalBids,
    timestamp: new Date(),
  });

  console.log(`💼 Bid notification emitted — event: ${eventId}, organiser: ${organizerId}`);
  return true;
};

/**
 * Notifies an organiser that their event was approved by an admin.
 *
 * @param {string} eventId
 * @param {string} organizerId
 * @param {{ title, status }} eventData
 * @returns {boolean}
 */
export const emitEventApproved = (eventId, organizerId, eventData) => {
  const io = getIO();

  io.to(`user-${organizerId}`).emit('event:approved', {
    eventId,
    eventTitle: eventData.title,
    status: eventData.status,
    message: 'Your event has been approved and is now live!',
    timestamp: new Date(),
  });

  console.log(`✅ Event approved notification emitted — organiser: ${organizerId}`);
  return true;
};

/**
 * Notifies an organiser that their event was rejected by an admin.
 *
 * @param {string} eventId
 * @param {string} organizerId
 * @param {string} reason
 * @returns {boolean}
 */
export const emitEventRejected = (eventId, organizerId, reason) => {
  const io = getIO();

  io.to(`user-${organizerId}`).emit('event:rejected', {
    eventId,
    reason,
    message: 'Your event was not approved. Please review the feedback and resubmit.',
    timestamp: new Date(),
  });

  console.log(`❌ Event rejected notification emitted — organiser: ${organizerId}`);
  return true;
};

/**
 * Sends any Socket.IO event directly to a single user's personal room.
 * Failures are logged but do not throw — callers must not depend on delivery.
 *
 * @param {string} userId
 * @param {string} eventName - Socket.IO event name (e.g. 'booking:new')
 * @param {object} data
 */
export const emitToUser = (userId, eventName, data) => {
  try {
    const io = getIO();
    io.to(`user-${userId}`).emit(eventName, { ...data, timestamp: new Date() });
    console.log(`📨 Emitted '${eventName}' to user: ${userId}`);
  } catch (err) {
    console.error(`Socket emitToUser failed (${eventName}):`, err.message);
  }
};

/**
 * Notifies the event room that a booking was cancelled and seats were released.
 *
 * @param {string} eventId
 * @param {{ currentAttendees: number, maxAttendees: number }} data
 */
export const emitBookingCancelled = (eventId, data) => {
  try {
    const io = getIO();
    io.to(`event-${eventId}`).emit('booking:cancelled', {
      eventId,
      currentAttendees: data.currentAttendees,
      maxAttendees: data.maxAttendees,
      availableSeats: data.maxAttendees - data.currentAttendees,
      timestamp: new Date(),
    });
    console.log(`📊 Booking cancellation emitted for event: ${eventId}`);
  } catch (err) {
    console.error('Socket emitBookingCancelled failed:', err.message);
  }
};

/**
 * Notifies a vendor that their bid was accepted.
 *
 * @param {string} vendorId
 * @param {{ bidId, eventTitle, requirementTitle, amount }} bidData
 */
export const emitBidAccepted = (vendorId, bidData) => {
  try {
    const io = getIO();
    io.to(`user-${vendorId}`).emit('bid:accepted', {
      bidId: bidData.bidId,
      eventTitle: bidData.eventTitle,
      requirementTitle: bidData.requirementTitle,
      amount: bidData.amount,
      message: `Congratulations! Your bid of ${bidData.amount} has been accepted.`,
      timestamp: new Date(),
    });
    console.log(`✅ Bid acceptance emitted to vendor: ${vendorId}`);
  } catch (err) {
    console.error('Socket emitBidAccepted failed:', err.message);
  }
};

/**
 * Notifies a vendor that their bid was rejected.
 *
 * @param {string} vendorId
 * @param {{ bidId, eventTitle, requirementTitle }} bidData
 */
export const emitBidRejected = (vendorId, bidData) => {
  try {
    const io = getIO();
    io.to(`user-${vendorId}`).emit('bid:rejected', {
      bidId: bidData.bidId,
      eventTitle: bidData.eventTitle,
      requirementTitle: bidData.requirementTitle,
      message: 'Your bid was not selected for this requirement.',
      timestamp: new Date(),
    });
    console.log(`❌ Bid rejection emitted to vendor: ${vendorId}`);
  } catch (err) {
    console.error('Socket emitBidRejected failed:', err.message);
  }
};

/**
 * Notifies a vendor that their account has been verified by an admin.
 *
 * @param {string} vendorId
 * @param {{ userName: string, message: string }} data
 */
export const emitVendorVerified = (vendorId, data) => {
  try {
    const io = getIO();
    io.to(`user-${vendorId}`).emit('vendor:verified', {
      isVerified: true,
      message: data.message,
      timestamp: new Date(),
    });
    console.log(`✅ Vendor verification emitted to: ${vendorId}`);
  } catch (err) {
    console.error('Socket emitVendorVerified failed:', err.message);
  }
};

/**
 * Returns the Socket.IO room name for a specific event.
 * @param {string} eventId
 * @returns {string}
 */
export const getEventRoom = (eventId) => `event-${eventId}`;

/**
 * Returns the Socket.IO personal room name for a specific user.
 * @param {string} userId
 * @returns {string}
 */
export const getUserRoom = (userId) => `user-${userId}`;
