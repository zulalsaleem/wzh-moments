import mongoose from 'mongoose';

/**
 * Embedded sub-schema for an individual timeline task.
 * Organizers update completion status; clients receive live updates via Socket.IO.
 */
const timelineItemSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    order: {
      type: Number,
    },
  },
  { _id: true }
);

/**
 * Embedded sub-schema for a vendor service requirement.
 * Vendors browse open requirements and submit Bids against them.
 */
const requirementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Requirement title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'assigned', 'completed'],
        message: 'Requirement status must be open, assigned, or completed',
      },
      default: 'open',
    },
  },
  { _id: true }
);

/**
 * Event schema — core entity of WZH Moments.
 * Supports embedded timelines (real-time progress) and requirements (vendor marketplace).
 * Events must be approved by an admin before going live.
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Event description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator(value) {
          return value > new Date();
        },
        message: 'Event date must be in the future',
      },
    },

    location: {
      type: String,
      required: [true, 'Event location is required'],
      maxlength: [200, 'Location cannot exceed 200 characters'],
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: {
        values: [
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
        ],
        message: 'Invalid event category',
      },
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'live', 'completed', 'cancelled'],
        message: 'Invalid event status',
      },
      default: 'pending',
    },

    maxAttendees: {
      type: Number,
      required: [true, 'Max attendees is required'],
      min: [1, 'Max attendees must be at least 1'],
      max: [100000, 'Max attendees cannot exceed 100,000'],
    },

    currentAttendees: {
      type: Number,
      default: 0,
      min: [0, 'Current attendees cannot be negative'],
    },

    timeline: {
      type: [timelineItemSchema],
      default: [],
    },

    requirements: {
      type: [requirementSchema],
      default: [],
    },

    coverImage: {
      type: String,
      default: null,
    },

    coverImagePublicId: {
      type: String,
      default: null,
    },

    imageUrl: {
      type: String,
    },

    ticketPrice: {
      type: Number,
      default: 0,
      min: [0, 'Ticket price cannot be negative'],
    },

    tags: {
      type: [String],
      default: [],
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
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1, date: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/**
 * Percentage of timeline tasks marked complete (0–100).
 * Drives the real-time progress bar shown to attendees.
 */
eventSchema.virtual('completionPercentage').get(function () {
  if (!this.timeline || this.timeline.length === 0) return 0;
  const completed = this.timeline.filter((t) => t.completed).length;
  return Math.round((completed / this.timeline.length) * 100);
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
