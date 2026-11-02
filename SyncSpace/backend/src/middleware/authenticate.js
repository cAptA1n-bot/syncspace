'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authenticate requests via HTTP-only cookie or Authorization header.
 * Attaches req.user = { id, email, role }
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Try cookie first (preferred, HTTP-only)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback: Authorization header (Bearer <token>)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'syncspace_fallback_jwt_secret_dev_and_tests');
  } catch (err) {
    throw new AppError(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', 401);
  }

  const user = await User.findById(decoded.id).select('-passwordHash').lean();
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  if (user.isDeleted) {
    throw new AppError('Account has been deleted', 401);
  }

  req.user = user;
  next();
});

/**
 * Optional authentication — sets req.user if token present, but does not reject.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash').lean();
    if (user && !user.isDeleted) req.user = user;
  } catch {
    // ignore — optional auth
  }
  next();
});

module.exports = { authenticate, optionalAuth };
