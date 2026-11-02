'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const DocumentVersion = require('../models/DocumentVersion');
const Document = require('../models/Document');
const documentService = require('../services/document.service');

router.use(authenticate);

/** GET /api/versions?documentId=... */
router.get('/', asyncHandler(async (req, res) => {
  const { documentId } = req.query;
  if (!documentId) throw new AppError('documentId required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const versions = await DocumentVersion.find({ document: documentId })
    .select('-yjsState -content')
    .populate('createdBy', 'firstName lastName email')
    .sort({ revision: -1 })
    .limit(50)
    .lean();

  res.json({ success: true, data: { versions } });
}));

/** GET /api/versions/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  const version = await DocumentVersion.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .lean();
  if (!version) throw new AppError('Version not found', 404);

  const role = await documentService.getDocumentRole(version.document, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  res.json({ success: true, data: { version } });
}));

/** POST /api/versions/:id/restore */
router.post('/:id/restore', asyncHandler(async (req, res) => {
  const version = await DocumentVersion.findById(req.params.id);
  if (!version) throw new AppError('Version not found', 404);

  const role = await documentService.getDocumentRole(version.document, req.user._id);
  if (!documentService.canPerformAction(role, 'write')) throw new AppError('Write access required', 403);

  // Save current state as a new version checkpoint before restoring
  const currentDoc = await Document.findById(version.document).select('content revision title');
  if (currentDoc) {
    await DocumentVersion.create({
      document: version.document,
      revision: currentDoc.revision + 1,
      title: currentDoc.title,
      content: currentDoc.content,
      createdBy: req.user._id,
      label: 'Before restore',
    });
  }

  // Restore
  await Document.findByIdAndUpdate(version.document, {
    content: version.content,
    yjsState: version.yjsState,
    revision: (currentDoc?.revision || 0) + 2,
    lastEditedBy: req.user._id,
  });

  res.json({ success: true, message: 'Version restored' });
}));

/** POST /api/versions — create manual checkpoint */
router.post('/', asyncHandler(async (req, res) => {
  const { documentId, label } = req.body;
  if (!documentId) throw new AppError('documentId required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'write')) throw new AppError('Write access required', 403);

  const doc = await Document.findById(documentId).select('content yjsState revision title');
  if (!doc) throw new AppError('Document not found', 404);

  const version = await DocumentVersion.create({
    document: documentId,
    revision: doc.revision,
    title: doc.title,
    content: doc.content,
    yjsState: doc.yjsState,
    createdBy: req.user._id,
    label: label || null,
  });

  res.status(201).json({ success: true, data: { version } });
}));

module.exports = router;
