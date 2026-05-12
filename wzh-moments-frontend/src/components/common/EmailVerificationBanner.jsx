import { useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  if (!user || user.isEmailVerified || dismissed) return null;

  const handleVerifyNow = async () => {
    try {
      setResending(true);
      await api.post('/auth/resend-otp', { email: user.email });
      toast.success('OTP sent! Check your email.');
      navigate('/verify-email', { state: { email: user.email } });
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Email not verified!</span>
            {' '}Please verify your email address to access all features.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyNow}
            disabled={resending}
            className="flex items-center gap-1.5 text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Verify Now'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-yellow-100 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-yellow-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
