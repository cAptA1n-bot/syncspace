'use strict';

const { validationResult } = require('express-validator');
const documentService = require('../services/document.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/** POST /api/documents */
const createDocument = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());

  const { title, workspaceId, folderId } = req.body;
  const doc = await documentService.createDocument({
    title, workspaceId, folderId, userId: req.user._id,
  });

  res.status(201).json({ success: true, data: { document: doc } });
});

/** GET /api/documents/:id */
const getDocument = asyncHandler(async (req, res) => {
  const { doc, role } = await documentService.getDocument(req.params.id, req.user._id);
  await documentService.touchDocument(req.params.id);
  res.json({ success: true, data: { document: doc, role } });
});

/** GET /api/documents — list workspace documents */
const listDocuments = asyncHandler(async (req, res) => {
  const { workspaceId, folderId, page = 1, limit = 50, sort = '-updatedAt' } = req.query;
  if (!workspaceId) throw new AppError('workspaceId is required', 400);

  const result = await documentService.listDocuments({
    workspaceId,
    userId: req.user._id,
    folderId: folderId !== undefined ? (folderId || null) : undefined,
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 100),
    sort,
  });

  res.json({ success: true, data: result });
});

/** GET /api/documents/recent */
const getRecentDocuments = asyncHandler(async (req, res) => {
  const docs = await documentService.getRecentDocuments(req.user._id, 10);
  res.json({ success: true, data: { documents: docs } });
});

/** PATCH /api/documents/:id */
const updateDocumentMeta = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());

  const doc = await documentService.updateDocumentMeta(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: { document: doc } });
});

/** POST /api/documents/:id/content */
const saveContent = asyncHandler(async (req, res) => {
  const { content, createVersion } = req.body;
  const doc = await documentService.saveDocumentContent(
    req.params.id,
    req.user._id,
    { content, createVersion }
  );
  res.json({ success: true, data: { document: doc } });
});

/** DELETE /api/documents/:id */
const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.params.id, req.user._id);
  res.json({ success: true, message: 'Document moved to trash' });
});

/** POST /api/documents/:id/restore */
const restoreDocument = asyncHandler(async (req, res) => {
  await documentService.restoreDocument(req.params.id, req.user._id);
  res.json({ success: true, message: 'Document restored' });
});

/** GET /api/documents/trash */
const getTrashedDocuments = asyncHandler(async (req, res) => {
  const docs = await documentService.getTrashedDocuments(req.user._id);
  res.json({ success: true, data: { documents: docs } });
});

module.exports = {
  createDocument,
  getDocument,
  listDocuments,
  getRecentDocuments,
  updateDocumentMeta,
  saveContent,
  deleteDocument,
  restoreDocument,
  getTrashedDocuments,
};
