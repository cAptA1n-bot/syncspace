'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const documentService = require('../services/document.service');
const { body, validationResult } = require('express-validator');

router.use(authenticate);

/** GET /api/comments?documentId=... */
router.get('/', asyncHandler(async (req, res) => {
  const { documentId } = req.query;
  if (!documentId) throw new AppError('documentId is required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const comments = await Comment.find({ document: documentId, isDeleted: false, parent: null })
    .populate('author', 'firstName lastName email avatar')
    .populate({
      path: 'replies',
      populate: { path: 'author', select: 'firstName lastName email avatar' },
    })
    .sort({ createdAt: 1 })
    .lean();

  // Attach replies
  const topLevel = await Comment.find({ document: documentId, isDeleted: false, parent: null })
    .populate('author', 'firstName lastName email avatar')
    .sort({ createdAt: 1 })
    .lean();

  const replies = await Comment.find({ document: documentId, isDeleted: false, parent: { $ne: null } })
    .populate('author', 'firstName lastName email avatar')
    .sort({ createdAt: 1 })
    .lean();

  const replyMap = {};
  for (const reply of replies) {
    const parentId = reply.parent.toString();
    if (!replyMap[parentId]) replyMap[parentId] = [];
    replyMap[parentId].push(reply);
  }

  const withReplies = topLevel.map((c) => ({
    ...c,
    replies: replyMap[c._id.toString()] || [],
  }));

  res.json({ success: true, data: { comments: withReplies } });
}));

/** POST /api/comments */
router.post('/', [
  body('documentId').notEmpty().isMongoId(),
  body('content').trim().notEmpty().isLength({ max: 5000 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());

  const { documentId, content, parentId, mentions } = req.body;
  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'comment')) throw new AppError('Comment permission required', 403);

  const comment = await Comment.create({
    document: documentId,
    author: req.user._id,
    content,
    parent: parentId || null,
    mentions: mentions || [],
  });

  // Notify mentioned users
  if (mentions && mentions.length > 0) {
    const notifs = mentions.map((userId) => ({
      recipient: userId,
      type: 'comment_mention',
      actor: req.user._id,
      entityId: comment._id,
      entityType: 'Comment',
      message: `${req.user.firstName} mentioned you in a comment`,
    }));
    await Notification.insertMany(notifs);
  }

  const populated = await Comment.findById(comment._id).populate('author', 'firstName lastName email avatar').lean();
  res.status(201).json({ success: true, data: { comment: populated } });
}));

/** DELETE /api/comments/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw new AppError('Comment not found', 404);

  const role = await documentService.getDocumentRole(comment.document, req.user._id);
  if (
    comment.author.toString() !== req.user._id.toString() &&
    !documentService.canPerformAction(role, 'admin')
  ) {
    throw new AppError('Cannot delete this comment', 403);
  }

  comment.isDeleted = true;
  comment.deletedAt = new Date();
  await comment.save();

  res.json({ success: true, message: 'Comment deleted' });
}));

/** PATCH /api/comments/:id/resolve */
router.patch('/:id/resolve', asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw new AppError('Comment not found', 404);

  const role = await documentService.getDocumentRole(comment.document, req.user._id);
  if (!documentService.canPerformAction(role, 'comment')) throw new AppError('Access denied', 403);

  comment.isResolved = !comment.isResolved;
  comment.resolvedBy = comment.isResolved ? req.user._id : null;
  comment.resolvedAt = comment.isResolved ? new Date() : null;
  await comment.save();

  res.json({ success: true, data: { comment } });
}));

module.exports = router;
