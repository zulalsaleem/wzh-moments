import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserRequest',
    default: null,
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  comment: {
    type: String,
    required: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [500, 'Review cannot exceed 500 characters'],
    trim: true,
  },

  vendorResponse: {
    type: String,
    maxlength: 300,
    default: null,
  },

  vendorResponseAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// One review per user per request (sparse so null requestId is ignored)
reviewSchema.index(
  { reviewerId: 1, requestId: 1 },
  { unique: true, sparse: true }
);

// One review per user per vendor
reviewSchema.index(
  { reviewerId: 1, vendorId: 1 },
  { unique: true }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
