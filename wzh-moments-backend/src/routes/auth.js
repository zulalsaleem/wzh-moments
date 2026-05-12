import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, verifyEmail, resendOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin, validateChangePassword } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationHandler.js';

const router = Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login',    validateLogin,    handleValidationErrors, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp',   resendOTP);

router.get('/me',      protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, validateChangePassword, handleValidationErrors, changePassword);

export default router;
