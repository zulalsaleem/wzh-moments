import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../services/socketService.js';
import { getIO } from '../config/socket.js';

// GET /api/chat/room/:eventId
export const getChatRoom = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizerId', 'name profileImage');

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    let chatRoom = await ChatRoom.findOne({ eventId })
      .populate('organizerId', 'name profileImage')
      .populate('participants', 'name profileImage');

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        eventId,
        organizerId: event.organizerId,
        participants: [],
        unreadCounts: {},
      });
      await chatRoom.populate('organizerId', 'name profileImage');
    }

    const userId = req.user.id;
    const isOrganizer = userId === event.organizerId?._id?.toString() ||
                        userId === event.organizerId?.toString();
    const isParticipant = chatRoom.participants.some(
      p => (p._id?.toString() ?? p.toString()) === userId
    );

    if (!isParticipant && !isOrganizer) {
      chatRoom.participants.push(userId);
      await chatRoom.save();
    }

    res.json({
      success: true,
      chatRoom,
      event: {
        _id: event._id,
        title: event.title,
        organizer: event.organizerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/:eventId/messages
export const getMessages = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const total = await Message.countDocuments({ eventId });

    const messages = await Message.find({ eventId })
      .populate('senderId', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Return in chronological order for the client
    messages.reverse();

    // Mark unread messages as read
    await Message.updateMany(
      {
        eventId,
        readBy: { $ne: req.user.id },
        senderId: { $ne: req.user.id },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    // Reset this user's unread count for the room
    await ChatRoom.findOneAndUpdate(
      { eventId },
      { $set: { [`unreadCounts.${req.user.id}`]: 0 } }
    );

    res.json({
      success: true,
      count: messages.length,
      total,
      hasMore: total > page * limit,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/chat/:eventId/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const message = await Message.create({
      eventId,
      senderId: req.user.id,
      text: text.trim(),
      readBy: [req.user.id],
    });

    await message.populate('senderId', 'name profileImage role');

    // Update the room's last message and add sender to participants
    const chatRoom = await ChatRoom.findOneAndUpdate(
      { eventId },
      {
        lastMessage: {
          text: text.trim().substring(0, 50),
          senderId: req.user.id,
          createdAt: new Date(),
        },
        $addToSet: { participants: req.user.id },
      },
      { new: true, upsert: true }
    );

    // Broadcast to everyone in the chat room (non-fatal if socket not ready)
    try {
      getIO().to(`chat-${eventId}`).emit('message:new', {
        message: message.toObject(),
        eventId,
      });
    } catch (socketErr) {
      console.error('Socket emit failed (non-fatal):', socketErr.message);
    }

    const organizerId = event.organizerId?.toString();
    const senderId = req.user.id?.toString();
    const senderIsOrganizer = senderId === organizerId;

    if (senderIsOrganizer) {
      // Organizer replied — notify every participant who is not the sender
      const room = await ChatRoom.findOne({ eventId });
      const targets = (room?.participants ?? [])
        .map(p => p.toString())
        .filter(id => id !== senderId);

      await Promise.all(targets.map(async (targetId) => {
        await ChatRoom.findOneAndUpdate(
          { eventId },
          { $inc: { [`unreadCounts.${targetId}`]: 1 } }
        );

        const notification = await Notification.create({
          userId: targetId,
          type: 'message_received',
          title: '💬 New Message!',
          message: `${req.user.name}: ${text.trim().substring(0, 50)}`,
          relatedId: eventId,
          relatedModel: 'Event',
        });

        emitToUser(targetId, 'notification:new', notification.toObject());

        const updatedRoom = await ChatRoom.findOne({ eventId });
        emitToUser(targetId, 'chat:unread', {
          eventId,
          count: updatedRoom?.unreadCounts?.get(targetId) ?? 1,
        });
      }));
    } else {
      // Attendee sent — notify only the organizer
      await ChatRoom.findOneAndUpdate(
        { eventId },
        { $inc: { [`unreadCounts.${organizerId}`]: 1 } }
      );

      const notification = await Notification.create({
        userId: organizerId,
        type: 'message_received',
        title: '💬 New Message!',
        message: `${req.user.name}: ${text.trim().substring(0, 50)}`,
        relatedId: eventId,
        relatedModel: 'Event',
      });

      emitToUser(organizerId, 'notification:new', notification.toObject());

      const updatedRoom = await ChatRoom.findOne({ eventId });
      emitToUser(organizerId, 'chat:unread', {
        eventId,
        count: updatedRoom?.unreadCounts?.get(organizerId) ?? 1,
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/my-rooms
export const getMyChatRooms = async (req, res, next) => {
  try {
    const query = req.user.role === 'organizer'
      ? { organizerId: req.user.id }
      : { participants: req.user.id };

    const chatRooms = await ChatRoom.find(query)
      .populate('eventId', 'title date coverImage')
      .populate('organizerId', 'name profileImage')
      .populate('participants', 'name profileImage')
      .populate('lastMessage.senderId', 'name')
      .sort({ updatedAt: -1 });

    const roomsWithUnread = chatRooms.map(room => {
      const obj = room.toObject();
      obj.myUnreadCount = room.unreadCounts?.get(req.user.id) ?? 0;
      return obj;
    });

    res.json({
      success: true,
      count: chatRooms.length,
      chatRooms: roomsWithUnread,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const chatRooms = await ChatRoom.find({
      $or: [
        { organizerId: req.user.id },
        { participants: req.user.id },
      ],
    });

    const totalUnread = chatRooms.reduce(
      (sum, room) => sum + (room.unreadCounts?.get(req.user.id) ?? 0),
      0
    );

    res.json({ success: true, unreadCount: totalUnread });
  } catch (error) {
    next(error);
  }
};
