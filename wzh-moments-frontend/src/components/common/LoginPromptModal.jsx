import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Lock } from 'lucide-react';

const LoginPromptModal = ({
  onClose,
  action = 'continue',
  message,
}) => {
  const navigate = useNavigate();

  const messages = {
    book: {
      title: 'Login to Book This Event',
      desc: 'Create a free account or login to book tickets and track events in real-time.',
      icon: '🎫',
    },
    chat: {
      title: 'Login to Chat',
      desc: 'Login to message the event organizer directly.',
      icon: '💬',
    },
    request: {
      title: 'Login to Post a Request',
      desc: 'Login to post your service needs and receive proposals from vendors.',
      icon: '📋',
    },
    proposal: {
      title: 'Login to Submit Proposal',
      desc: 'Login to submit your proposal and win this service request.',
      icon: '💼',
    },
    default: {
      title: 'Login Required',
      desc: message || 'Please login or create an account to continue.',
      icon: '🔐',
    },
  };

  const content = messages[action] || messages.default;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm
      z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl
        w-full max-w-sm overflow-hidden relative">

        <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary-500" />

        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2
              hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>

          <div className="text-5xl text-center mb-4">
            {content.icon}
          </div>

          <h2 className="text-xl font-black text-gray-900
            text-center mb-2">
            {content.title}
          </h2>
          <p className="text-gray-500 text-sm text-center
            mb-6 leading-relaxed">
            {content.desc}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center
                gap-2 py-3.5 bg-gradient-to-r from-primary-500
                to-secondary-500 text-white font-bold rounded-2xl
                hover:opacity-90 transition-opacity shadow-md"
            >
              <LogIn className="h-5 w-5" />
              Login to Continue
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center
                gap-2 py-3.5 border-2 border-primary-500
                text-primary-600 font-bold rounded-2xl
                hover:bg-primary-50 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Create Free Account
            </button>
          </div>

          <div className="flex items-center justify-center
            gap-1.5 mt-4">
            <Lock className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-400">
              Free forever · No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
