'use strict';

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { body, validationResult } = require('express-validator');

// GET /api/users/search?q=email
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) throw new AppError('Search query must be at least 2 characters', 400);

  const users = await User.find({
    isDeleted: false,
    $or: [
      { email: { $regex: q.trim(), $options: 'i' } },
      { firstName: { $regex: q.trim(), $options: 'i' } },
      { lastName: { $regex: q.trim(), $options: 'i' } },
    ],
  })
    .select('firstName lastName email avatar')
    .limit(10)
    .lean();

  res.json({ success: true, data: { users } });
});

// GET /api/users/:id/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('firstName lastName email avatar bio createdAt').lean();
  if (!user || user.isDeleted) throw new AppError('User not found', 404);
  res.json({ success: true, data: { user } });
});

// PATCH /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());

  const allowed = ['firstName', 'lastName', 'bio', 'avatar'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select('-passwordHash')
    .lean();

  res.json({ success: true, data: { user } });
});

router.use(authenticate);
router.get('/search', searchUsers);
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  res.json({ success: true, data: { user } });
}));
router.patch('/me', [
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
], updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;
