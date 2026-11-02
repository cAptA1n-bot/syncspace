'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Document = require('../models/Document');
const User = require('../models/User');
const documentService = require('../services/document.service');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/shares/:documentId — share document with a user
 */
const shareDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { email, role } = req.body;

  if (!email) throw new AppError('Email is required', 400);
  if (!['viewer', 'commenter', 'editor'].includes(role)) {
    throw new AppError('Invalid role. Must be viewer, commenter, or editor', 400);
  }

  const docRole = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(docRole, 'admin')) {
    throw new AppError('Only document owners can manage sharing', 403);
  }

  const targetUser = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
  if (!targetUser) throw new AppError('User not found', 404);

  if (targetUser._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot share document with yourself', 400);
  }

  const doc = await Document.findById(documentId);
  if (!doc || doc.isDeleted) throw new AppError('Document not found', 404);

  // Update or add collaborator
  const existingIdx = doc.collaborators.findIndex(
    (c) => c.user.toString() === targetUser._id.toString()
  );

  if (existingIdx >= 0) {
    doc.collaborators[existingIdx].role = role;
  } else {
    doc.collaborators.push({ user: targetUser._id, role });
  }

  await doc.save();

  // Create notification
  await Notification.create({
    recipient: targetUser._id,
    type: 'document_shared',
    actor: req.user._id,
    entityId: documentId,
    entityType: 'Document',
    message: `${req.user.firstName} shared a document with you as ${role}`,
  });

  res.json({ success: true, message: `Document shared with ${email} as ${role}` });
});

/**
 * DELETE /api/shares/:documentId/users/:userId — revoke access
 */
const revokeShare = asyncHandler(async (req, res) => {
  const { documentId, userId } = req.params;

  const docRole = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(docRole, 'admin')) {
    throw new AppError('Only document owners can manage sharing', 403);
  }

  const doc = await Document.findById(documentId);
  if (!doc || doc.isDeleted) throw new AppError('Document not found', 404);

  doc.collaborators = doc.collaborators.filter(
    (c) => c.user.toString() !== userId
  );
  await doc.save();

  res.json({ success: true, message: 'Access revoked' });
});

/**
 * GET /api/shares/:documentId — list collaborators
 */
const listCollaborators = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const docRole = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(docRole, 'read')) {
    throw new AppError('Access denied', 403);
  }

  const doc = await Document.findById(documentId)
    .populate('collaborators.user', 'firstName lastName email avatar')
    .populate('owner', 'firstName lastName email avatar')
    .lean();

  if (!doc) throw new AppError('Document not found', 404);

  res.json({
    success: true,
    data: {
      owner: doc.owner,
      collaborators: doc.collaborators,
      shareLink: {
        enabled: doc.shareLink.enabled,
        role: doc.shareLink.role,
        token: doc.shareLink.enabled ? doc.shareLink.token : null,
      },
    },
  });
});

/**
 * POST /api/shares/:documentId/link — create/update share link
 */
const updateShareLink = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { enabled, role } = req.body;

  const docRole = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(docRole, 'admin')) {
    throw new AppError('Only document owners can manage sharing', 403);
  }

  const doc = await Document.findById(documentId);
  if (!doc || doc.isDeleted) throw new AppError('Document not found', 404);

  if (enabled && !doc.shareLink.token) {
    doc.shareLink.token = uuidv4();
  }

  if (enabled !== undefined) doc.shareLink.enabled = enabled;
  if (role) doc.shareLink.role = role;

  await doc.save();

  res.json({
    success: true,
    data: {
      shareLink: {
        enabled: doc.shareLink.enabled,
        role: doc.shareLink.role,
        token: doc.shareLink.enabled ? doc.shareLink.token : null,
      },
    },
  });
});

router.use(authenticate);
router.get('/:documentId', listCollaborators);
router.post('/:documentId', shareDocument);
router.delete('/:documentId/users/:userId', revokeShare);
router.post('/:documentId/link', updateShareLink);

module.exports = router;
