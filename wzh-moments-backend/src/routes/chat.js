import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getChatRoom,
  getMessages,
  sendMessage,
  getMyChatRooms,
  getUnreadCount,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/my-rooms', protect, getMyChatRooms);
router.get('/unread-count', protect, getUnreadCount);
router.get('/room/:eventId', protect, getChatRoom);
router.get('/:eventId/messages', protect, getMessages);
router.post('/:eventId/messages', protect, sendMessage);

export default router;
