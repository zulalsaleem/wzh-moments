import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import {
  sendWelcomeEmail, sendOTPEmail, sendResendOTPEmail,
  sendForgotPasswordEmail, sendPasswordResetSuccessEmail,
} from '../services/emailService.js';
import { generateOTP, generateOTPExpiry, isOTPExpired } from '../utils/generateOTP.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    const user = await User.create({
      name, email, password, role, phone,
      isEmailVerified: false,
      emailVerificationOTP: otp,
      emailVerificationExpires: otpExpiry,
    });

    const emailResult = await sendOTPEmail(email, name, otp);

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? 'Account created! Please check your email for the OTP.'
        : 'Account created! Email could not be sent — contact support.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: false,
      },
      emailSent: emailResult.success,
      requiresVerification: true,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email })
      .select('+emailVerificationOTP +emailVerificationExpires');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Email already verified' });
    }

    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please check your email.' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationExpires = null;
    await user.save();

    sendWelcomeEmail(user.email, user.name, user.role)
      .catch(err => console.error('Welcome email failed:', err.message));

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to WZH Moments!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Resend email verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Email already verified' });
    }

    const otp = generateOTP();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = generateOTPExpiry();
    await user.save();

    const result = await sendResendOTPEmail(user.email, user.name, otp);
    console.log('Resend OTP result:', result);

    res.json({
      success: true,
      message: 'New OTP sent to your email!',
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Authenticate user and return token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select password explicitly — it is excluded by default (select: false)
    const user = await User.findOne({ email }).select('+password');

    // Return the same generic message for wrong email OR wrong password
    // to avoid leaking which field is incorrect (enumeration prevention)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

/**
 * @desc    Update profile fields (name, phone, bio, profileImage)
 * @route   PUT /api/auth/profile
 * @access  Protected
 */
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'profileImage'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change authenticated user's password
 * @route   PUT /api/auth/password
 * @access  Protected
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hook to hash new password

    const token = generateToken(user._id, user.role);

    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 1 — Request a password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Don't reveal whether the email exists
    if (!user) {
      return res.json({
        success: true,
        message: 'If this email exists, a reset code has been sent.',
      });
    }

    const otp = generateOTP();
    const expiry = generateOTPExpiry();

    user.passwordResetOTP = otp;
    user.passwordResetExpires = expiry;
    user.passwordResetVerified = false;
    await user.save();

    const emailResult = await sendForgotPasswordEmail(user.email, user.name, otp);
    console.log('Forgot password email:', emailResult);

    res.json({
      success: true,
      message: 'Password reset code sent to your email.',
      emailSent: emailResult.success,
      ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 2 — Verify the reset OTP
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordResetOTP +passwordResetExpires +passwordResetVerified');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.passwordResetOTP) {
      return res.status(400).json({
        success: false,
        error: 'No reset request found. Please request a new code.',
      });
    }

    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid code. Please check and try again.' });
    }

    if (isOTPExpired(user.passwordResetExpires)) {
      return res.status(400).json({ success: false, error: 'Code has expired. Please request a new one.' });
    }

    user.passwordResetVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Code verified! You can now set a new password.',
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 3 — Set the new password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +passwordResetOTP +passwordResetExpires +passwordResetVerified');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.passwordResetVerified) {
      return res.status(400).json({ success: false, error: 'Please verify your reset code first' });
    }

    if (isOTPExpired(user.passwordResetExpires)) {
      return res.status(400).json({ success: false, error: 'Reset session expired. Please start again.' });
    }

    user.password = newPassword;
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;
    user.passwordResetVerified = false;
    await user.save();

    sendPasswordResetSuccessEmail(user.email, user.name)
      .catch(err => console.error('Reset success email failed:', err.message));

    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (err) {
    next(err);
  }
};
