'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const AppError = require('../utils/AppError');

/**
 * Sign a JWT and return it.
 * @param {string} userId
 * @returns {string}
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'syncspace_fallback_jwt_secret_dev_and_tests', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Set auth cookie on the response.
 */
const setCookieToken = (res, token) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? 'none' : 'lax');

  res.cookie('token', token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
  });
};

/**
 * Register a new user and create their personal workspace.
 */
const register = async ({ firstName, lastName, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  // Create personal workspace automatically
  const workspace = await Workspace.create({
    name: `${user.firstName}'s Space`,
    owner: user._id,
    isPersonal: true,
  });

  // Make user the workspace owner
  await WorkspaceMembership.create({
    workspace: workspace._id,
    user: user._id,
    role: 'owner',
    inviteStatus: 'accepted',
  });

  return user;
};

/**
 * Login and return user + token.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select passwordHash
  const user = await User.findOne({ email: normalizedEmail, isDeleted: false }).select('+passwordHash');
  if (!user) {
    // Generic message to avoid account enumeration
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last active timestamp
  user.lastActiveAt = new Date();
  await user.save();

  const token = signToken(user._id);
  return { user, token };
};

/**
 * Get current user profile (no sensitive fields).
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }
  return user;
};

/**
 * Change password.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
};

module.exports = { register, login, getCurrentUser, changePassword, signToken, setCookieToken };
