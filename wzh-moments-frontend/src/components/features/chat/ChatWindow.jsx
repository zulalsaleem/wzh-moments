import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { useChat } from '../../../hooks/useChat';
import { useAuth } from '../../../hooks/useAuth';
import { getRelativeTime } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const FIVE_MINUTES = 5 * 60 * 1000;

const ChatWindow = ({ eventId, eventTitle, organizer, onClose, defaultMinimized = false }) => {
  const { user } = useAuth();
  const { messages, loading, sending, typingUsers, sendMessage, setTyping } = useChat(eventId);

  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(defaultMinimized);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);

  useEffect(() => {
    if (!minimized) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [minimized]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setTyping(false);
    try {
      await sendMessage(text);
    } catch {
      toast.error('Failed to send message');
      setInput(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const isMyMessage = (message) => {
    const sid = message.senderId?._id ?? message.senderId?.id ?? message.senderId;
    return sid?.toString() === user?.id?.toString();
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${minimized ? 'h-14' : 'h-[480px]'} w-80 sm:w-96`}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 flex-shrink-0 cursor-pointer"
        onClick={() => setMinimized(m => !m)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
            {organizer?.profileImage ? (
              <img src={organizer.profileImage} alt={organizer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {organizer?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">
              {organizer?.name || 'Organizer'}
            </p>
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-[180px]">
              {eventTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {minimized
              ? <Maximize2 className="h-4 w-4 text-white" />
              : <Minimize2 className="h-4 w-4 text-white" />}
          </button>
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-300 mt-1">Send a message to start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const mine = isMyMessage(message);
                const prev = messages[index - 1];
                const showTime = index === 0 ||
                  new Date(message.createdAt) - new Date(prev?.createdAt) > FIVE_MINUTES;

                return (
                  <div key={message._id}>
                    {showTime && (
                      <div className="text-center my-2">
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                          {getRelativeTime(message.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                          {message.senderId?.profileImage ? (
                            <img src={message.senderId.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-xs font-bold">
                              {message.senderId?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="max-w-[70%]">
                        {!mine && (
                          <p className="text-xs text-gray-500 mb-1 ml-1">{message.senderId?.name}</p>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          mine
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                        } ${message.isTemp ? 'opacity-60' : ''}`}>
                          {message.text}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-2 items-center">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">{typingUsers[0]} is typing...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all max-h-24 min-h-[42px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
              >
                {sending
                  ? <Loader className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWindow;
