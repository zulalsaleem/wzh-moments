import mongoose from 'mongoose';

/**
 * Booking schema — joins a User to an Event.
 * Compound unique index on (userId, eventId) prevents a user booking the same event twice.
 * Payment integration (Stripe) is stubbed via paymentIntentId for a future phase.
 */
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },

    numberOfTickets: {
      type: Number,
      required: [true, 'Number of tickets is required'],
      min: [1, 'At least 1 ticket must be booked'],
      default: 1,
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled'],
        message: 'Booking status must be pending, confirmed, or cancelled',
      },
      default: 'confirmed',
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'refunded', 'failed'],
        message: 'Payment status must be pending, completed, refunded, or failed',
      },
      default: 'pending',
    },

    // Reserved for Stripe integration in a later phase
    paymentIntentId: {
      type: String,
    },

    bookedAt: {
      type: Date,
      default: Date.now,
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
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
