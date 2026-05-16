import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    localStorage.getItem('pendingVerificationEmail') ||
    '';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/verify-email', { email, otp: otpString });
      if (res.data.success) {
        setVerified(true);
        toast.success('Email verified successfully! 🎉');
        const saved = JSON.parse(localStorage.getItem('user') || '{}');
        saved.isEmailVerified = true;
        localStorage.setItem('user', JSON.stringify(saved));
        localStorage.removeItem('pendingVerificationEmail');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email!');
      setTimeLeft(120);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Email Verified! 🎉</h2>
          <p className="text-gray-500">Redirecting to your dashboard...</p>
          <div className="mt-6 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 w-full animate-[width_2s_linear]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-500 text-sm">We sent a 6-digit OTP to</p>
            <p className="font-semibold text-gray-900 text-sm mt-1">
              {email || 'your email address'}
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                  focus:border-primary-500 focus:ring-2 focus:ring-primary-200
                  ${digit
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-900'
                  }`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-500">
                OTP expires in{' '}
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-primary-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">OTP expired! Please request a new one.</p>
            )}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6 || timeLeft <= 0}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm
              bg-gradient-to-r from-primary-500 to-secondary-500
              hover:from-primary-600 hover:to-secondary-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-md hover:shadow-lg mb-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={resending || timeLeft > 0}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>

          {/* Back */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Wrong email? Register again
            </button>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
