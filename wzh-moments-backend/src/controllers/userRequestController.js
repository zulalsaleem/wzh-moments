import UserRequest from '../models/UserRequest.js';
import VendorProposal from '../models/VendorProposal.js';
import * as socketService from '../services/socketService.js';

// ─── CREATE REQUEST ───────────────────────────────────────────────────────────
export const createUserRequest = async (req, res, next) => {
  try {
    const { title, description, category, budget, eventDate, location, preferences } = req.body;

    const request = await UserRequest.create({
      userId: req.user.id,
      title,
      description,
      category,
      budget,
      eventDate,
      location,
      preferences: preferences || '',
    });

    await request.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Request posted! Vendors will send proposals soon.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET ALL REQUESTS (vendor browsing) ──────────────────────────────────────
export const getAllUserRequests = async (req, res, next) => {
  try {
    const {
      category,
      status,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isApproved: true };

    // Admins can see all statuses; everyone else sees open by default
    if (req.user.role === 'admin') {
      if (status) filter.status = status;
    } else {
      filter.status = status || 'open';
    }

    if (category) filter.category = category;

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await UserRequest.find(filter)
      .populate('userId', 'name email createdAt')
      .populate('assignedVendorId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await UserRequest.countDocuments(filter);

    const requestsWithCounts = await Promise.all(
      requests.map(async (request) => {
        const proposalCount = await VendorProposal.countDocuments({
          requestId: request._id,
        });

        let hasProposed = false;
        if (req.user.role === 'vendor') {
          const existing = await VendorProposal.findOne({
            requestId: request._id,
            vendorId: req.user.id,
          });
          hasProposed = !!existing;
        }

        return { ...request, proposalCount, hasProposed };
      })
    );

    res.json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      hasNextPage: Number(page) < Math.ceil(total / limit),
      requests: requestsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE REQUEST ───────────────────────────────────────────────────────
export const getUserRequestById = async (req, res, next) => {
  try {
    const request = await UserRequest.findById(req.params.id)
      .populate('userId', 'name email phone createdAt')
      .populate('assignedVendorId', 'name email phone');

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    await UserRequest.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY REQUESTS (authenticated user's own requests) ─────────────────────
export const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const requests = await UserRequest.find(filter)
      .populate('assignedVendorId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const requestsWithCounts = await Promise.all(
      requests.map(async (request) => {
        const proposalCount = await VendorProposal.countDocuments({ requestId: request._id });
        return { ...request.toObject(), proposalCount };
      })
    );

    const total = await UserRequest.countDocuments(filter);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      requests: requestsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// ─── CANCEL REQUEST ───────────────────────────────────────────────────────────
export const cancelUserRequest = async (req, res, next) => {
  try {
    const request = await UserRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (request.status === 'assigned') {
      return res
        .status(400)
        .json({ success: false, error: 'Cannot cancel an already assigned request' });
    }

    request.status = 'cancelled';
    await request.save();

    await VendorProposal.updateMany(
      { requestId: request._id, status: 'pending' },
      { status: 'rejected', respondedAt: new Date() }
    );

    res.json({ success: true, message: 'Request cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── MARK REQUEST COMPLETED ───────────────────────────────────────────────────
export const markRequestCompleted = async (req, res, next) => {
  try {
    const request = await UserRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (request.status !== 'assigned') {
      return res
        .status(400)
        .json({ success: false, error: 'Only assigned requests can be marked completed' });
    }

    request.status = 'completed';
    await request.save();

    if (request.assignedVendorId) {
      try {
        socketService.emitToUser(request.assignedVendorId.toString(), 'request:completed', {
          requestId: request._id,
          requestTitle: request.title,
          message: 'Your service has been marked as completed!',
        });
      } catch (e) {
        console.error('Socket emit failed:', e.message);
      }
    }

    res.json({ success: true, message: 'Request marked as completed', request });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: GET ALL REQUESTS ──────────────────────────────────────────────────
export const adminGetAllRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const requests = await UserRequest.find(filter)
      .populate('userId', 'name email')
      .populate('assignedVendorId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await UserRequest.countDocuments(filter);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: DELETE REQUEST ────────────────────────────────────────────────────
export const adminDeleteRequest = async (req, res, next) => {
  try {
    const request = await UserRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    await VendorProposal.deleteMany({ requestId: request._id });
    await request.deleteOne();

    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    next(error);
  }
};
