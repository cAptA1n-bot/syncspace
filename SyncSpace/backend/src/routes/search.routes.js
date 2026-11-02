'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Document = require('../models/Document');
const WorkspaceMembership = require('../models/WorkspaceMembership');

router.use(authenticate);

/** GET /api/search?q=...&workspaceId=... */
router.get('/', asyncHandler(async (req, res) => {
  const { q, workspaceId, page = 1, limit = 20 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ success: true, data: { documents: [], total: 0 } });
  }

  // Get accessible workspaces
  let workspaceFilter;
  if (workspaceId) {
    const membership = await WorkspaceMembership.findOne({
      workspace: workspaceId,
      user: req.user._id,
      inviteStatus: 'accepted',
    });
    if (!membership) throw new AppError('Workspace access denied', 403);
    workspaceFilter = [workspaceId];
  } else {
    const memberships = await WorkspaceMembership.find({
      user: req.user._id,
      inviteStatus: 'accepted',
    }).select('workspace').lean();
    workspaceFilter = memberships.map((m) => m.workspace);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    Document.find({
      workspace: { $in: workspaceFilter },
      isDeleted: false,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id },
      ],
      $text: { $search: q.trim() },
    })
      .select('-yjsState -content')
      .populate('owner', 'firstName lastName email avatar')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Document.countDocuments({
      workspace: { $in: workspaceFilter },
      isDeleted: false,
      $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }],
      $text: { $search: q.trim() },
    }),
  ]);

  res.json({ success: true, data: { documents, total, page: parseInt(page), limit: parseInt(limit) } });
}));

module.exports = router;
