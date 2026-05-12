import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Joins an event Socket.IO room and listens for real-time updates.
 * Cleans up (leaves room) on unmount or eventId change.
 *
 * Backend events consumed:
 *   user-joined   — {eventId, connectedUsers}
 *   user-left     — {eventId, connectedUsers}
 *   progress:update — {eventId, timeline, updatedTask, completionPercentage}
 *   booking:created — {eventId, currentAttendees, maxAttendees, availableSeats}
 *   booking:cancelled — {eventId, currentAttendees, maxAttendees, availableSeats}
 */
export function useEventSocket(eventId) {
  const { socket, connected } = useSocket();
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [progressUpdate, setProgressUpdate] = useState(null);
  const [attendeeUpdate, setAttendeeUpdate] = useState(null);

  useEffect(() => {
    if (!socket || !connected || !eventId) return;

    console.log(`🔌 Joining event room: ${eventId}`);
    socket.emit('join-event', { eventId });

    socket.on('user-joined', (data) => {
      setConnectedUsers(data.connectedUsers ?? 0);
    });

    socket.on('user-left', (data) => {
      setConnectedUsers(data.connectedUsers ?? 0);
    });

    // THE MAIN REAL-TIME EVENT — timeline task marked complete/incomplete
    socket.on('progress:update', (data) => {
      console.log('📊 Progress update received:', data);
      setProgressUpdate(data);
    });

    // Live attendee count updates
    socket.on('booking:created', (data) => {
      console.log('🎫 New booking:', data);
      setAttendeeUpdate({ currentAttendees: data.currentAttendees });
    });

    socket.on('booking:cancelled', (data) => {
      console.log('🎫 Booking cancelled:', data);
      setAttendeeUpdate({ currentAttendees: data.currentAttendees });
    });

    return () => {
      console.log(`🔌 Leaving event room: ${eventId}`);
      socket.emit('leave-event', { eventId });
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('progress:update');
      socket.off('booking:created');
      socket.off('booking:cancelled');
    };
  }, [socket, connected, eventId]);

  return {
    connectedUsers,
    progressUpdate,
    attendeeUpdate,
    isConnected: connected,
  };
}
