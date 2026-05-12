import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail, sendOTPEmail, sendResendOTPEmail } from '../services/emailService.js';
import { generateOTP, generateOTPExpiry } from '../utils/generateOTP.js';

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

    await sendResendOTPEmail(user.email, user.name, otp);

    res.json({ success: true, message: 'New OTP sent to your email!' });
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
