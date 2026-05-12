import mongoose from 'mongoose';

/**
 * Bid schema — vendor marketplace.
 * A vendor submits one Bid per Event requirement (enforced by compound unique index).
 * Organizers review bids and accept/reject them, which updates requirement status on the Event.
 */
const bidSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor is required'],
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },

    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Requirement ID is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0, 'Bid amount cannot be negative'],
    },

    proposal: {
      type: String,
      required: [true, 'Proposal is required'],
      minlength: [20, 'Proposal must be at least 20 characters'],
      maxlength: [1000, 'Proposal cannot exceed 1000 characters'],
      trim: true,
    },

    deliveryTime: {
      type: String,
      required: [true, 'Delivery time is required'],
      trim: true,
    },

    portfolioLinks: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected'],
        message: 'Bid status must be pending, accepted, or rejected',
      },
      default: 'pending',
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
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
bidSchema.index({ vendorId: 1 });
bidSchema.index({ eventId: 1 });
bidSchema.index({ status: 1 });
// Prevents a vendor from submitting two bids on the same requirement
bidSchema.index({ vendorId: 1, eventId: 1, requirementId: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
