import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useChat = (eventId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatRoom, setChatRoom] = useState(null);
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await api.get(`/chat/${eventId}/messages`);
      setMessages(res.data.messages || []);
      setHasMore(res.data.hasMore || false);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const initChatRoom = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await api.get(`/chat/room/${eventId}`);
      setChatRoom(res.data.chatRoom);
    } catch (err) {
      console.error('Failed to init chat room:', err);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      initChatRoom();
      fetchMessages();
    }
  }, [eventId, initChatRoom, fetchMessages]);

  useEffect(() => {
    if (!socket || !connected || !eventId) return;

    socket.emit('join-chat', { eventId });

    const onNewMessage = ({ message }) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        // Replace matching optimistic message if text and sender match
        const tempIdx = prev.findIndex(
          m => m.isTemp &&
               m.senderId?._id === message.senderId?._id &&
               m.text === message.text
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = message;
          return next;
        }
        return [...prev, message];
      });
    };

    const onTyping = ({ userName, isTyping }) => {
      setTypingUsers(prev =>
        isTyping
          ? prev.includes(userName) ? prev : [...prev, userName]
          : prev.filter(u => u !== userName)
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('chat:typing', onTyping);

    return () => {
      socket.emit('leave-chat', { eventId });
      socket.off('message:new', onNewMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [socket, connected, eventId]);

  const sendMessage = async (text) => {
    if (!text?.trim() || sending) return;
    const trimmed = text.trim();
    const tempId = `temp-${Date.now()}`;

    const tempMessage = {
      _id: tempId,
      text: trimmed,
      senderId: {
        _id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
      createdAt: new Date().toISOString(),
      readBy: [user.id],
      isTemp: true,
    };

    setMessages(prev => [...prev, tempMessage]);
    setSending(true);

    try {
      const res = await api.post(`/chat/${eventId}/messages`, { text: trimmed });
      // Socket broadcast will replace the temp via onNewMessage;
      // as a fallback also replace by tempId here
      setMessages(prev =>
        prev.map(m => m._id === tempId ? res.data.message : m)
      );
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      throw err;
    } finally {
      setSending(false);
    }
  };

  const setTyping = (isTyping) => {
    if (!socket) return;
    socket.emit('chat:typing', { eventId, isTyping });
    if (isTyping) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', { eventId, isTyping: false });
      }, 2000);
    }
  };

  return {
    messages,
    loading,
    sending,
    hasMore,
    typingUsers,
    chatRoom,
    sendMessage,
    setTyping,
    refetch: fetchMessages,
  };
};
