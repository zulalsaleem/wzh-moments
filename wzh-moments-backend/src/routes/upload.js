import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  uploadEventCover,
  uploadProfilePicture,
  uploadPortfolio,
} from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';
import Event from '../models/Event.js';

const router = express.Router();

// POST /api/upload/event/:eventId/cover
router.post(
  '/event/:eventId/cover',
  protect,
  (req, res, next) => {
    uploadEventCover(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      if (
        event.organizerId?.toString() !== req.user.id?.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      if (event.coverImagePublicId) {
        await cloudinary.uploader.destroy(event.coverImagePublicId);
      }

      event.coverImage = req.file.path;
      event.coverImagePublicId = req.file.filename;
      await event.save();

      res.json({
        success: true,
        message: 'Cover photo uploaded successfully',
        coverImage: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/upload/profile
router.post(
  '/profile',
  protect,
  (req, res, next) => {
    uploadProfilePicture(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const user = await User.findById(req.user.id);

      if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      }

      user.profileImage = req.file.path;
      user.profileImagePublicId = req.file.filename;
      await user.save();

      res.json({
        success: true,
        message: 'Profile picture updated!',
        profileImage: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/upload/portfolio
router.post(
  '/portfolio',
  protect,
  (req, res, next) => {
    uploadPortfolio(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No images provided' });
      }

      const imageUrls = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      const user = await User.findById(req.user.id);
      user.portfolioImages = [...(user.portfolioImages || []), ...imageUrls];
      await user.save();

      res.json({
        success: true,
        message: 'Portfolio images uploaded!',
        images: imageUrls,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// DELETE /api/upload/image/:publicId
router.delete('/image/:publicId', protect, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
