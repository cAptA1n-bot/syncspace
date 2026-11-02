'use strict';

const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 422, errors.array());
  }

  const { firstName, lastName, email, password } = req.body;
  const user = await authService.register({ firstName, lastName, email, password });

  const token = authService.signToken(user._id);
  authService.setCookieToken(res, token);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 422, errors.array());
  }

  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  authService.setCookieToken(res, token);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        lastActiveAt: user.lastActiveAt,
      },
      token,
    },
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  res.json({ success: true, data: { user } });
});

/**
 * PATCH /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 422, errors.array());
  }
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, { currentPassword, newPassword });
  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = { register, login, logout, getCurrentUser, changePassword };
