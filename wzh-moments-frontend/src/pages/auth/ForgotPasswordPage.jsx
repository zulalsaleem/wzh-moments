import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowLeft, CheckCircle, Send,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

const ForgotPasswordPage = () => {
  // Steps: 1=email  2=otp  3=newpassword  4=success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(120);

  // Keep interval ref so we can clear it before starting a new one
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(120);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── STEP 1: Send OTP ─────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter a valid email address' });
      return;
    }
    try {
      setLoading(true);
      setErrors({});
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      toast.success('Reset code sent! Check your email.');
      startTimer();
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  // ── STEP 2: Verify OTP ───────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/verify-reset-otp', { email, otp: otpString });
      toast.success('Code verified!');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email });
      toast.success('New code sent!');
      setOtp(['', '', '', '', '', '']);
      startTimer();
      document.getElementById('otp-0')?.focus();
    } catch {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset Password ───────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newPassword) errs.newPassword = 'Required';
    else if (newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Required';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email, newPassword, confirmPassword });
      setStep(4);
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600 px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="p-8">

            {/* Back to login */}
            {step < 4 && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            )}

            {/* ── STEP 1: EMAIL ── */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Forgot Password?</h2>
                  <p className="text-gray-500 text-sm mt-2">
                    Enter your email and we'll send you a reset code
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors({}); }}
                        placeholder="your@email.com"
                        className={`w-full pl-10 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                        autoFocus
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <Button type="submit" loading={loading} icon={Send} className="w-full">
                    Send Reset Code
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Enter Code</h2>
                  <p className="text-gray-500 text-sm mt-2">We sent a 6-digit code to</p>
                  <p className="text-gray-900 font-semibold text-sm">{email}</p>
                </div>

                {/* OTP inputs */}
                <div className="flex gap-2 justify-center mb-4" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${digit ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300'}`}
                    />
                  ))}
                </div>

                {/* Countdown */}
                <div className="text-center mb-4">
                  {timeLeft > 0 ? (
                    <p className={`text-sm font-medium ${timeLeft < 30 ? 'text-red-500' : 'text-gray-500'}`}>
                      Code expires in{' '}
                      <span className="font-bold">{formatTime(timeLeft)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">Code expired!</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full"
                    disabled={otp.join('').length !== 6 || timeLeft === 0}
                  >
                    Verify Code
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={timeLeft > 0 || loading}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-600 font-medium hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend Code
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: NEW PASSWORD ── */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">New Password</h2>
                  <p className="text-gray-500 text-sm mt-2">Choose a strong password</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: '' })); }}
                        placeholder="Min 6 characters"
                        className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400 ${errors.newPassword ? 'border-red-400' : 'border-gray-300'}`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                        placeholder="Re-enter password"
                        className={`w-full pl-10 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary-400 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                      />
                    </div>
                    {newPassword && confirmPassword && (
                      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                        {newPassword === confirmPassword
                          ? <><CheckCircle className="h-3 w-3" /> Match!</>
                          : <><AlertCircle className="h-3 w-3" /> No match</>
                        }
                      </div>
                    )}
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" loading={loading} icon={Lock} className="w-full">
                    Reset Password
                  </Button>
                </div>
              </form>
            )}

            {/* ── STEP 4: SUCCESS ── */}
            {step === 4 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Password Reset! 🎉</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Your password has been successfully reset. You can now login with your new password.
                </p>
                <Link
                  to="/login"
                  className="block w-full py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-center"
                >
                  Login Now →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Step dots */}
        {step < 4 && (
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-white' : 'w-4 bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
