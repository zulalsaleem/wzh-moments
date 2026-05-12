import mongoose from 'mongoose';

/**
 * Notification schema — persisted layer for the real-time alert system.
 * Socket.IO emits notifications in real-time; this collection stores them
 * so users can retrieve unread notifications on reconnect.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
    },

    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'event_created',
          'event_approved',
          'event_rejected',
          'event_updated',
          'booking_created',
          'booking_cancelled',
          'bid_received',
          'bid_accepted',
          'bid_rejected',
          'timeline_update',
          'requirement_posted',
          'vendor_verified',
          'proposal_received',
          'proposal_accepted',
          'proposal_rejected',
        ],
        message: 'Invalid notification type',
      },
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
      trim: true,
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    relatedModel: {
      type: String,
      enum: {
        values: ['Event', 'Booking', 'Bid', 'User', 'VendorProposal'],
        message: 'relatedModel must be Event, Booking, Bid, User, or VendorProposal',
      },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
