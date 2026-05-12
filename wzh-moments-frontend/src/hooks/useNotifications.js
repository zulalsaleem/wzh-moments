import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, connected } = useSocket();
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get(endpoints.notifications.list);
      const notifs = res.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewNotification = (data) => {
      const newNotif = {
        _id: data.notificationId || Date.now().toString(),
        title: data.title || 'New Notification',
        message: data.message,
        type: data.type || 'general',
        isRead: false,
        createdAt: new Date(),
        relatedId: data.relatedId,
        relatedModel: data.relatedModel,
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      toast(data.message || data.title, {
        icon: getNotificationIcon(newNotif.type),
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#fff',
          borderRadius: '12px',
        },
      });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('event:approved', (data) =>
      handleNewNotification({ ...data, type: 'event_approved', title: 'Event Approved! 🎉' })
    );
    socket.on('event:rejected', (data) =>
      handleNewNotification({ ...data, type: 'event_rejected', title: 'Event Update' })
    );
    socket.on('proposal:received', (data) =>
      handleNewNotification({ ...data, type: 'proposal_received', title: 'New Proposal! 💼' })
    );
    socket.on('proposal:accepted', (data) =>
      handleNewNotification({ ...data, type: 'proposal_accepted', title: 'Proposal Accepted! 🏆' })
    );
    socket.on('vendor:verified', (data) =>
      handleNewNotification({ ...data, type: 'vendor_verified', title: 'Account Verified! ✅' })
    );
    socket.on('booking:created', (data) =>
      handleNewNotification({ ...data, type: 'booking_created', title: 'New Booking! 🎫' })
    );

    return () => {
      socket.off('notification:new');
      socket.off('event:approved');
      socket.off('event:rejected');
      socket.off('proposal:received');
      socket.off('proposal:accepted');
      socket.off('vendor:verified');
      socket.off('booking:created');
    };
  }, [socket, connected]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(endpoints.notifications.markRead(notificationId));
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(endpoints.notifications.markAllRead);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export const getNotificationIcon = (type) => {
  const icons = {
    event_approved:    '✅',
    event_rejected:    '❌',
    booking_created:   '🎫',
    booking_cancelled: '🚫',
    bid_received:      '💼',
    bid_accepted:      '🏆',
    bid_rejected:      '📋',
    timeline_update:   '📊',
    vendor_verified:   '✅',
    proposal_received: '📨',
    proposal_accepted: '🎉',
    proposal_rejected: '📋',
    requirement_posted:'📌',
  };
  return icons[type] || '🔔';
};

export const getNotificationLink = (notification, userRole) => {
  const { type } = notification;
  switch (type) {
    case 'event_approved':
    case 'event_rejected':
      return '/organizer/dashboard';
    case 'booking_created':
    case 'booking_cancelled':
      return userRole === 'organizer' ? '/organizer/dashboard' : '/dashboard';
    case 'bid_received':
    case 'bid_accepted':
    case 'bid_rejected':
      return userRole === 'vendor' ? '/vendor/dashboard' : '/organizer/dashboard';
    case 'proposal_received':
      return '/dashboard';
    case 'proposal_accepted':
    case 'proposal_rejected':
      return '/vendor/dashboard';
    case 'vendor_verified':
      return '/vendor/dashboard';
    default:
      return '/dashboard';
  }
};
