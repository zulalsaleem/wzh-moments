import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, X, Send, Bot,
  User, Minimize2, Maximize2,
  ChevronRight
} from 'lucide-react';

// ─── FUTURE AI CONFIG ─────────────────────────────────────────────
const USE_AI_MODEL = false;
const HF_API_URL = 'https://api-inference.huggingface.co/models/YOUR_MODEL_NAME';
const HF_API_KEY = 'hf_YOUR_TOKEN_HERE';

// ─── PREDEFINED Q&A KNOWLEDGE BASE ───────────────────────────────
const knowledgeBase = [
  {
    keywords: ['what is', 'wzh moments', 'about', 'platform', 'tell me'],
    answer: `WZH Moments is a real-time event management platform built for Pakistan.
You can:
🎫 Book events and track progress LIVE
📅 Organize events with timeline management
💼 Offer services as a verified vendor
🔐 Manage everything as an admin

Think of it as "Uber for Events" - you always know what's happening!`,
  },
  {
    keywords: ['create event', 'how to create', 'new event', 'organize event', 'add event'],
    answer: `To create an event on WZH Moments:

1️⃣ Register as an **Organizer**
2️⃣ Go to your Organizer Dashboard
3️⃣ Click **"Create Event"** button
4️⃣ Fill in: Title, Date, Location, Category
5️⃣ Add **Timeline Tasks** (these get tracked live!)
6️⃣ Add vendor requirements (optional)
7️⃣ Submit for Admin approval

Your event goes live once admin approves it! 🚀`,
  },
  {
    keywords: ['real time', 'real-time', 'tracking', 'live', 'progress', 'socket', 'update'],
    answer: `Our real-time tracking is THE core feature! 🔴

How it works:
⚡ Organizer marks a task complete in their dashboard
📡 Socket.IO instantly broadcasts to ALL attendees
✅ Progress circle updates WITHOUT page refresh
👥 Everyone watching sees it simultaneously

This is powered by **Socket.IO WebSockets** -
like a permanent phone call between your browser
and our server. Updates arrive in under 2 seconds!`,
  },
  {
    keywords: ['book', 'booking', 'ticket', 'reserve', 'how to book', 'attend'],
    answer: `Booking an event is simple! 🎫

Steps:
1️⃣ Browse events at /events
2️⃣ Click on any event you like
3️⃣ Click **"Book Now"** button
4️⃣ Confirm your booking
5️⃣ View in your **User Dashboard**

After booking, you can:
📊 Track event progress in real-time
❌ Cancel if needed (before event date)
📈 See your booking history`,
  },
  {
    keywords: ['vendor', 'provide service', 'bid', 'proposal', 'photographer', 'catering', 'decoration'],
    answer: `As a Vendor on WZH Moments you can:

💼 **Bid on Event Requirements**
   - Organizers post needs (photography, catering, etc.)
   - Submit competitive bids
   - Win jobs and grow your business

📋 **Respond to User Requests**
   - Users post personal requests (birthday, wedding)
   - Browse all open requests
   - Send proposals directly to users

⚠️ Note: Vendors need **Admin Verification** before bidding.
Register → Go to vendor dashboard → Wait for admin approval`,
  },
  {
    keywords: ['become vendor', 'register vendor', 'vendor account', 'verification', 'verified'],
    answer: `To become a verified vendor:

1️⃣ Register with role **"Provide Services"**
2️⃣ Complete your profile
3️⃣ Wait for **Admin verification** (usually quick!)
4️⃣ Once verified, start browsing and bidding

Until verified, you can browse requests but
cannot submit proposals.

Contact admin if verification takes too long! 📞`,
  },
  {
    keywords: ['admin', 'administrator', 'approve', 'approval', 'manage'],
    answer: `Admin controls the entire platform:

🔐 **Event Management**
   - Approves/rejects submitted events
   - Ensures quality before events go live

👥 **User Management**
   - Verifies vendor accounts
   - Manages all user roles

📊 **Analytics Dashboard**
   - Total users, events, bookings
   - Revenue tracking
   - Platform performance metrics

💡 To become admin, contact the WZH team directly.`,
  },
  {
    keywords: ['marketplace', 'service request', 'post request', 'find vendor', 'hire'],
    answer: `The WZH Marketplace connects users with service providers! 🛒

**As a User:**
📝 Post your requirements (birthday party, wedding setup)
💰 Set your budget
📨 Receive proposals from verified vendors/organizers
✅ Accept the best proposal

**As a Vendor/Organizer:**
🔍 Browse all open service requests
💼 Submit competitive proposals
🎯 Win jobs and build reputation

Find it at **/marketplace** in the navigation!`,
  },
  {
    keywords: ['category', 'type', 'wedding', 'birthday', 'conference', 'corporate', 'concert'],
    answer: `WZH Moments supports these event categories:

🎂 Birthday Party     📸 Photography
💍 Wedding Setup      🍽️ Catering
🏢 Corporate Event    🎨 Decoration
🎵 Sound System       🏛️ Venue Booking
🎭 Entertainment      📋 Other

Each category helps vendors find relevant
opportunities and users find the right services!`,
  },
  {
    keywords: ['role', 'roles', 'user role', 'organizer', 'difference', 'account type'],
    answer: `WZH Moments has 4 user roles:

🎫 **User (Attendee)**
   Browse, book events, track progress, post requests

📅 **Organizer**
   Create events, update timelines, hire vendors

💼 **Vendor**
   Bid on events, respond to user requests
   (Requires admin verification)

🔐 **Admin**
   Approve events, verify vendors, view analytics

Choose your role when registering!
You can have different accounts for different roles.`,
  },
  {
    keywords: ['price', 'cost', 'free', 'paid', 'fee', 'charge', 'ticket price'],
    answer: `Pricing on WZH Moments:

🆓 **Platform Registration**: FREE for all users

🎫 **Event Tickets**: Set by organizers
   - Some events are FREE (ticketPrice: 0)
   - Paid events show price on event page
   - Price visible before booking

💼 **Vendor Bids**: You set your own price
   - No platform commission (for now)
   - Negotiate directly with clients

The platform itself is free to use! 🎉`,
  },
  {
    keywords: ['notification', 'alert', 'notify', 'email', 'update notification'],
    answer: `WZH Moments sends real-time notifications for:

📊 **Event Updates**
   - Your event approved/rejected by admin
   - Timeline tasks completed (live!)

🎫 **Booking Updates**
   - Booking confirmed
   - Event updates from organizer

💼 **Marketplace**
   - New proposal received
   - Your proposal accepted/rejected
   - Vendor verified by admin

All notifications appear instantly via
Socket.IO - no refresh needed! 🔴`,
  },
  {
    keywords: ['technology', 'tech stack', 'built with', 'mern', 'react', 'nodejs', 'mongodb'],
    answer: `WZH Moments is built with modern tech:

⚛️ **Frontend**: React + Vite + Tailwind CSS
🟢 **Backend**: Node.js + Express.js
🍃 **Database**: MongoDB Atlas
⚡ **Real-time**: Socket.IO (WebSockets)
🔐 **Auth**: JWT + bcrypt
☁️ **Deploy**: Vercel + Render

This is the **MERN Stack** - industry standard
for modern web applications.

The real-time feature uses Socket.IO which
enables instant bi-directional communication
between server and all connected browsers!`,
  },
  {
    keywords: ['contact', 'support', 'help', 'email', 'team', 'developer'],
    answer: `Need help with WZH Moments?

👨‍💻 **Development Team:**
   - M. Haris Munir (CIIT/FA22-BCS-069)
   - M. Zulal Saleem (CIIT/FA22-BCS-093)
   - Wali Muhammad (CIIT/FA22-BCS-121)

🏫 **COMSATS University Islamabad**
   Sahiwal Campus, Pakistan

📧 For platform issues, contact admin through
the dashboard or reach out to the dev team.

This is a Final Year Project (FYP) 2022-2026 🎓`,
  },
  {
    keywords: ['cancel', 'cancellation', 'refund', 'cancel booking'],
    answer: `To cancel a booking:

1️⃣ Go to **User Dashboard**
2️⃣ Click **"My Bookings"** tab
3️⃣ Find the booking you want to cancel
4️⃣ Click **"Cancel"** button

⚠️ Important:
- You can only cancel UPCOMING events
- Past events cannot be cancelled
- Cancellation frees up seats for others

For refunds, contact the event organizer directly.`,
  },
  {
    keywords: ['password', 'forgot', 'login problem', 'cant login', 'reset'],
    answer: `Having login issues?

🔑 **Forgot Password:**
   - Click "Forgot password?" on login page
   - (Reset feature coming soon!)
   - For now, contact admin for account recovery

✅ **Common Login Issues:**
   - Make sure email is correct (lowercase)
   - Password must be 6+ characters
   - Include at least one number in password

💡 **Tip:** Use the demo accounts to test:
   - user@test.com
   - organizer@test.com
   - vendor@test.com`,
  },
  {
    keywords: ['socket.io', 'websocket', 'how does real time work', 'websockets'],
    answer: `Great technical question! 🤓

**Regular HTTP** (old way):
Browser asks → Server replies → Connection closes
Like sending a letter - slow, one direction

**Socket.IO/WebSocket** (our way):
Permanent connection between browser and server
Both sides can send messages ANYTIME
Like a phone call - instant, both directions

In WZH Moments:
1. You open an event page
2. Your browser "calls" our server (joins room)
3. When organizer updates timeline, server
   instantly "calls" ALL browsers in that room
4. Your page updates in < 2 seconds
5. NO refresh needed!

This is how Uber shows your driver's location 🚗`,
  },
];

// ─── SMART RESPONSE FUNCTION ──────────────────────────────────────
const getSmartResponse = (userMessage) => {
  const message = userMessage.toLowerCase().trim();

  let bestMatch = null;
  let highestScore = 0;

  knowledgeBase.forEach(item => {
    let score = 0;
    item.keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    });
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  });

  if (bestMatch && highestScore > 0) {
    return bestMatch.answer;
  }

  return `I'm not sure about that specific question, but I can help you with:

🎫 **Booking events** - How to find and book
📅 **Creating events** - Organizer guide
💼 **Vendor services** - Bidding & proposals
🔴 **Real-time tracking** - How it works
🛒 **Marketplace** - Service requests
👤 **User roles** - User, Organizer, Vendor, Admin

Try asking about any of these topics!
Or type **"help"** to see all topics.`;
};

// ─── CALL HUGGING FACE API (Future use) ──────────────────────────
const callHuggingFaceAPI = async (message, conversationHistory) => {
  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          past_user_inputs: conversationHistory
            .filter(m => m.role === 'user')
            .map(m => m.content),
          generated_responses: conversationHistory
            .filter(m => m.role === 'bot')
            .map(m => m.content),
          text: message,
        },
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) throw new Error('HF API request failed');

    const data = await response.json();

    if (data.generated_text) return data.generated_text;
    if (data[0]?.generated_text) return data[0].generated_text;
    if (data.conversation?.generated_responses) {
      const responses = data.conversation.generated_responses;
      return responses[responses.length - 1];
    }

    return 'Sorry, I could not generate a response. Please try again.';
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return getSmartResponse(message);
  }
};

// ─── QUICK SUGGESTION QUESTIONS ──────────────────────────────────
const quickQuestions = [
  "What is WZH Moments?",
  "How to create an event?",
  "How does real-time tracking work?",
  "How to become a vendor?",
  "What is the marketplace?",
];

// ─── MAIN CHATBOT COMPONENT ───────────────────────────────────────
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: `Hi! 👋 I'm **WZH Assistant**, your event management helper!

I can answer questions about:
🎫 Booking events
📅 Creating & managing events
💼 Vendor marketplace
🔴 Real-time tracking
👤 User roles & features

What would you like to know?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (messageText) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    setShowQuickQuestions(false);
    setInputValue('');

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);

    await new Promise(resolve =>
      setTimeout(resolve, USE_AI_MODEL ? 1500 : 800)
    );

    let botResponse;

    if (USE_AI_MODEL) {
      botResponse = await callHuggingFaceAPI(text, messages);
    } else {
      botResponse = getSmartResponse(text);
    }

    setIsTyping(false);

    const botMessage = {
      id: Date.now() + 1,
      role: 'bot',
      content: botResponse,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* ── CHAT WINDOW ── */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col
            bg-white rounded-3xl shadow-2xl border border-gray-200
            overflow-hidden transition-all duration-300
            ${isMinimized ? 'h-16 w-72' : 'w-80 sm:w-96 h-[500px] sm:h-[560px]'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            bg-gradient-to-r from-primary-600 to-secondary-600 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20
                flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">
                  WZH Assistant
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/80 text-xs">
                    {USE_AI_MODEL ? 'AI Powered' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized
                  ? <Maximize2 className="h-4 w-4 text-white" />
                  : <Minimize2 className="h-4 w-4 text-white" />
                }
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center
                        flex-shrink-0 mt-1
                        ${message.role === 'bot'
                          ? 'bg-gradient-to-br from-primary-500 to-secondary-500'
                          : 'bg-gray-300'
                        }`}
                    >
                      {message.role === 'bot'
                        ? <Bot className="h-4 w-4 text-white" />
                        : <User className="h-4 w-4 text-gray-600" />
                      }
                    </div>

                    <div className="max-w-[75%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                          ${message.role === 'bot'
                            ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                            : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-tr-sm'
                          }`}
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      <p
                        className={`text-xs text-gray-400 mt-1
                          ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br
                      from-primary-500 to-secondary-500 flex items-center
                      justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl
                      rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {showQuickQuestions && (
                <div className="px-4 py-2 bg-white border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    Quick Questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="flex items-center gap-1 text-xs bg-primary-50
                          text-primary-700 border border-primary-200 px-2.5 py-1
                          rounded-full hover:bg-primary-100 transition-colors"
                      >
                        {q}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about events, booking, vendors..."
                    rows={1}
                    className="flex-1 resize-none border border-gray-300 rounded-2xl
                      px-4 py-2.5 text-sm outline-none focus:ring-2
                      focus:ring-primary-400 focus:border-transparent
                      transition-all max-h-24 min-h-[42px]"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 flex items-center justify-center
                      bg-gradient-to-r from-primary-500 to-secondary-500
                      text-white rounded-2xl hover:from-primary-600
                      hover:to-secondary-600 transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex-shrink-0 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {USE_AI_MODEL
                    ? '🤖 Powered by AI Model'
                    : '💡 Smart Assistant • Type or click a question'
                  }
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full
          shadow-2xl flex items-center justify-center transition-all duration-300
          hover:scale-110 active:scale-95
          ${isOpen
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-primary-500 to-secondary-500'
          }`}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="absolute inset-0 rounded-full
              bg-gradient-to-br from-primary-400 to-secondary-400
              animate-ping opacity-30" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500
              rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">?</span>
            </span>
          </>
        )}
      </button>
    </>
  );
};

export default ChatBot;
