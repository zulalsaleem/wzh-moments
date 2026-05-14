import mongoose from 'mongoose';
import Review from '../models/Review.js';
import User from '../models/User.js';
import VendorProposal from '../models/VendorProposal.js';
import UserRequest from '../models/UserRequest.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../services/socketService.js';

// ─── SUBMIT REVIEW ─────────────────────────────
// POST /api/reviews
export const submitReview = async (req, res, next) => {
  try {
    const { vendorId, requestId, rating, comment } = req.body;

    if (!vendorId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'vendorId, rating and comment are required',
      });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    if (vendorId.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot review yourself' });
    }

    const existingReview = await Review.findOne({
      reviewerId: req.user.id,
      vendorId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this vendor',
      });
    }

    if (requestId) {
      const request = await UserRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ success: false, error: 'Service request not found' });
      }
      if (request.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Only the request owner can leave a review',
        });
      }
    }

    const review = await Review.create({
      reviewerId: req.user.id,
      vendorId,
      requestId: requestId || null,
      rating,
      comment: comment.trim(),
    });

    await review.populate('reviewerId', 'name profileImage');

    await updateVendorRating(vendorId);

    const notification = await Notification.create({
      userId: vendorId,
      type: 'review_received',
      title: '⭐ New Review Received!',
      message: `${req.user.name} rated you ${rating} star${rating > 1 ? 's' : ''}`,
      relatedId: review._id,
      relatedModel: 'Review',
    });

    emitToUser(vendorId, 'notification:new', { ...notification.toObject() });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this vendor',
      });
    }
    next(error);
  }
};

// ─── GET VENDOR REVIEWS ────────────────────────
// GET /api/reviews/vendor/:vendorId
export const getVendorReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [reviews, total, breakdown, vendor] = await Promise.all([
      Review.find({ vendorId: req.params.vendorId })
        .populate('reviewerId', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),

      Review.countDocuments({ vendorId: req.params.vendorId }),

      Review.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(req.params.vendorId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),

      User.findById(req.params.vendorId, 'name averageRating totalReviews'),
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach(item => { ratingBreakdown[item._id] = item.count; });

    res.json({
      success: true,
      count: reviews.length,
      total,
      averageRating: vendor?.averageRating || 0,
      totalReviews: vendor?.totalReviews || 0,
      ratingBreakdown,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CHECK IF USER CAN REVIEW VENDOR ──────────
// GET /api/reviews/can-review/:vendorId
export const canReviewVendor = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const existing = await Review.findOne({ reviewerId: req.user.id, vendorId });
    if (existing) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'Already reviewed',
        existingReview: existing,
      });
    }

    const acceptedProposal = await VendorProposal.findOne({
      vendorId,
      status: 'accepted',
    }).populate('requestId');

    const hadInteraction =
      acceptedProposal &&
      acceptedProposal.requestId?.userId?.toString() === req.user.id;

    res.json({
      success: true,
      canReview: hadInteraction,
      reason: hadInteraction ? 'Can review' : 'No completed interaction found',
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY REVIEWS (as reviewer) ─────────────
// GET /api/reviews/my-reviews
export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewerId: req.user.id })
      .populate('vendorId', 'name profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// ─── VENDOR RESPOND TO REVIEW ─────────────────
// PATCH /api/reviews/:id/respond
export const respondToReview = async (req, res, next) => {
  try {
    const { response } = req.body;

    if (!response?.trim()) {
      return res.status(400).json({ success: false, error: 'Response text is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (review.vendorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the reviewed vendor can respond',
      });
    }

    review.vendorResponse = response.trim();
    review.vendorResponseAt = new Date();
    await review.save();

    res.json({ success: true, message: 'Response added successfully', review });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE REVIEW ─────────────────────────────
// DELETE /api/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (
      review.reviewerId.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review',
      });
    }

    const vendorId = review.vendorId;
    await review.deleteOne();
    await updateVendorRating(vendorId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── HELPER: recalculate and persist vendor average rating ─────────────────
const updateVendorRating = async (vendorId) => {
  const result = await Review.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);

  const averageRating = result[0]
    ? Math.round(result[0].averageRating * 10) / 10
    : 0;
  const totalReviews = result[0]?.totalReviews || 0;

  await User.findByIdAndUpdate(vendorId, { averageRating, totalReviews });
};
