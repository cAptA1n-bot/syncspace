'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Attachment = require('../models/Attachment');
const documentService = require('../services/document.service');
const logger = require('../utils/logger');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
const ALLOWED_MIMES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain').split(',');

let uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    uploadDir = path.join(os.tmpdir(), 'syncspace-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    logger.warn(`[Attachments] Permission denied on default uploadDir. Falling back to temporary directory: ${uploadDir}`);
  } else {
    throw err;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

router.use(authenticate);

/** POST /api/attachments */
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const { documentId } = req.body;
  if (!documentId) throw new AppError('documentId is required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'write')) {
    // Clean up file
    fs.unlink(req.file.path, () => {});
    throw new AppError('Write permission required to upload attachments', 403);
  }

  const attachment = await Attachment.create({
    document: documentId,
    uploadedBy: req.user._id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey: req.file.filename,
    storageProvider: 'local',
    url: `/api/attachments/${uuidv4()}/download`,
  });

  // Update URL with real ID
  attachment.url = `/api/attachments/${attachment._id}/download`;
  await attachment.save();

  res.status(201).json({ success: true, data: { attachment } });
}));

/** GET /api/attachments?documentId=... */
router.get('/', asyncHandler(async (req, res) => {
  const { documentId } = req.query;
  if (!documentId) throw new AppError('documentId required', 400);

  const role = await documentService.getDocumentRole(documentId, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const attachments = await Attachment.find({ document: documentId, isDeleted: false })
    .populate('uploadedBy', 'firstName lastName email')
    .lean();

  res.json({ success: true, data: { attachments } });
}));

/** GET /api/attachments/:id/download */
router.get('/:id/download', asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment || attachment.isDeleted) throw new AppError('Attachment not found', 404);

  const role = await documentService.getDocumentRole(attachment.document, req.user._id);
  if (!documentService.canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const filePath = path.join(uploadDir, attachment.storageKey);
  if (!fs.existsSync(filePath)) throw new AppError('File not found on server', 404);

  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
  res.sendFile(filePath);
}));

/** DELETE /api/attachments/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment || attachment.isDeleted) throw new AppError('Attachment not found', 404);

  const role = await documentService.getDocumentRole(attachment.document, req.user._id);
  if (!documentService.canPerformAction(role, 'write')) throw new AppError('Write permission required', 403);

  attachment.isDeleted = true;
  attachment.deletedAt = new Date();
  await attachment.save();

  // Attempt to remove file
  const filePath = path.join(uploadDir, attachment.storageKey);
  fs.unlink(filePath, () => {}); // non-blocking

  res.json({ success: true, message: 'Attachment deleted' });
}));

module.exports = router;
