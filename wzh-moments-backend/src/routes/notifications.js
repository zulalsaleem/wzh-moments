import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = Router();

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const { unread, page = 1, limit = 50 } = req.query;

    const filter = { userId: req.user.id };
    if (unread === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    res.json({ success: true, count: notifications.length, total, unreadCount, notifications });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/read-all  — must be BEFORE /:id/read
router.patch('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read', updatedCount: result.modifiedCount });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;
