import mongoose from 'mongoose';

const userRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'birthday_party',
        'wedding_setup',
        'corporate_event',
        'photography',
        'catering',
        'decoration',
        'sound_system',
        'venue_booking',
        'entertainment',
        'other',
      ],
    },
    budget: {
      type: Number,
      required: true,
      min: [0, 'Budget must be positive'],
    },
    eventDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (date) {
          return date > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    location: {
      type: String,
      required: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    preferences: {
      type: String,
      maxlength: [500, 'Preferences cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'completed', 'cancelled'],
      default: 'open',
    },
    assignedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedProposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProposal',
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    proposalsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userRequestSchema.index({ userId: 1 });
userRequestSchema.index({ status: 1 });
userRequestSchema.index({ category: 1 });
userRequestSchema.index({ eventDate: 1 });
userRequestSchema.index({ status: 1, category: 1, eventDate: 1 });

export default mongoose.model('UserRequest', userRequestSchema);
