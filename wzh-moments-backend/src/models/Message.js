import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text',
  },
}, {
  timestamps: true,
});

messageSchema.index({ eventId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
