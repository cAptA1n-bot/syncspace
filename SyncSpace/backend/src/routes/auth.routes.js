'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/auth.validator');

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerValidator, authController.register);
router.post('/login', authLimiter, loginValidator, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.patch('/change-password', authenticate, changePasswordValidator, authController.changePassword);

module.exports = router;
