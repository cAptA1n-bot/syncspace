'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const AiSummary = require('../models/AiSummary');
const Document = require('../models/Document');
const documentService = require('../services/document.service');
const aiService = require('../services/ai.service');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'AI request limit reached. Please wait a minute.' },
});

const VALID_TYPES = ['short', 'medium', 'detailed', 'key_points', 'action_items'];

router.use(authenticate);

/** POST /api/ai/summarize */
router.post('/summarize', aiLimiter, asyncHandler(async (req, res) => {
  const { documentId, summaryType = 'medium' } = req.body;
  if (!documentId) throw new AppError('documentId is required', 400);
  if (!VALID_TYPES.includes(summaryType)) {
    throw new AppError(`summaryType must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  // Authorization check BEFORE any content is accessed
  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) {
    throw new AppError('Access denied', 403);
  }

  const doc = await Document.findById(documentId).select('content revision aiSummaryRevision title').lean();
  if (!doc) throw new AppError('Document not found', 404);

  const currentRevision = doc.aiSummaryRevision || doc.revision;

  // Check cache
  const cached = await AiSummary.findOne({
    document: documentId,
    revision: currentRevision,
    summaryType,
    isStale: false,
  });

  if (cached) {
    return res.json({
      success: true,
      data: {
        summary: cached.content,
        summaryType,
        cached: true,
        revision: currentRevision,
        documentTitle: doc.title,
      },
    });
  }

  // Generate new summary
  const summaryContent = await aiService.generateSummary({
    content: doc.content,
    summaryType,
  });

  // Save to cache (upsert)
  await AiSummary.findOneAndUpdate(
    { document: documentId, revision: currentRevision, summaryType },
    {
      content: summaryContent,
      requestedBy: req.user._id,
      provider: process.env.AI_PROVIDER || 'gemini',
      isStale: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    data: {
      summary: summaryContent,
      summaryType,
      cached: false,
      revision: currentRevision,
      documentTitle: doc.title,
    },
  });
}));

/** GET /api/ai/summaries?documentId=... */
router.get('/summaries', asyncHandler(async (req, res) => {
  const { documentId } = req.query;
  if (!documentId) throw new AppError('documentId required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const doc = await Document.findById(documentId).select('aiSummaryRevision revision').lean();
  const currentRevision = doc?.aiSummaryRevision || doc?.revision || 0;

  const summaries = await AiSummary.find({
    document: documentId,
    revision: currentRevision,
    isStale: false,
  })
    .select('summaryType content createdAt revision')
    .lean();

  res.json({ success: true, data: { summaries, currentRevision } });
}));

module.exports = router;
