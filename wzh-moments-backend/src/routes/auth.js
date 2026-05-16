import { Router } from 'express';
import {
  register, login, getMe,
  updateProfile, changePassword,
  verifyEmail, resendOTP,
  forgotPassword, verifyResetOTP, resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin, validateChangePassword } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationHandler.js';

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login',    validateLogin,    handleValidationErrors, login);

// ── Email verification ────────────────────────────────────────────
router.post('/verify-email', verifyEmail);
router.post('/resend-otp',   resendOTP);

// ── Forgot / reset password (3-step flow) ────────────────────────
router.post('/forgot-password',   forgotPassword);
router.post('/verify-reset-otp',  verifyResetOTP);
router.post('/reset-password',    resetPassword);

// ── Protected ─────────────────────────────────────────────────────
router.get('/me',      protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, validateChangePassword, handleValidationErrors, changePassword);

// ── Dev: smoke-test email delivery (remove before shipping) ───────
if (process.env.NODE_ENV === 'development') {
  router.get('/test-email', async (req, res) => {
    try {
      const { sendEmail } = await import('../services/emailService.js');
      const to = req.query.email || process.env.EMAIL_USER;
      const result = await sendEmail(to, 'welcome', ['Test User', 'user']);
      res.json({ result, sentTo: to });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;
