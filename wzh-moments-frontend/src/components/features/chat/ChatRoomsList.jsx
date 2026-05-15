import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Loader } from 'lucide-react';
import api from '../../../api/axios';
import { getRelativeTime } from '../../../utils/helpers';
import ChatWindow from './ChatWindow';

const ChatRoomsList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  const fetchChatRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/chat/my-rooms');
      setChatRooms(res.data.chatRooms || []);
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChatRooms(); }, [fetchChatRooms]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No messages yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Attendees can chat with you from event pages
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chatRooms.map(room => (
        <button
          key={room._id}
          onClick={() => setActiveChat(room)}
          className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all text-left"
        >
          {/* Event thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 flex-shrink-0">
            {room.eventId?.coverImage ? (
              <img src={room.eventId.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {room.eventId?.title || 'Event Chat'}
            </p>
            {room.lastMessage?.text && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {room.lastMessage.senderId?.name
                  ? `${room.lastMessage.senderId.name}: `
                  : ''}
                {room.lastMessage.text}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {room.lastMessage?.createdAt && (
              <p className="text-xs text-gray-400">
                {getRelativeTime(room.lastMessage.createdAt)}
              </p>
            )}
            {room.myUnreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {room.myUnreadCount > 9 ? '9+' : room.myUnreadCount}
              </span>
            )}
          </div>
        </button>
      ))}

      {/* Active chat floating window */}
      {activeChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatWindow
            eventId={activeChat.eventId?._id}
            eventTitle={activeChat.eventId?.title}
            organizer={activeChat.organizerId}
            onClose={() => {
              setActiveChat(null);
              fetchChatRooms();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatRoomsList;
