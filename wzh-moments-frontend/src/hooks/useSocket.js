import { useEffect } from 'react';
import { useSocket as _useSocket } from '../context/SocketContext';

/**
 * Subscribe to a socket event for the lifetime of the component.
 * handler should be stable (wrap in useCallback if needed).
 */
export function useSocketEvent(event, handler) {
  const { socket } = _useSocket();

  useEffect(() => {
    if (!socket || !event) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, event, handler]);
}

export { useSocket } from '../context/SocketContext';
