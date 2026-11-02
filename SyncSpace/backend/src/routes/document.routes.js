'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const documentController = require('../controllers/document.controller');
const { body } = require('express-validator');

const docMetaValidator = [
  body('title').optional().trim().isLength({ max: 500 }).withMessage('Title too long'),
];
const docCreateValidator = [
  body('workspaceId').notEmpty().withMessage('workspaceId is required').isMongoId().withMessage('Invalid workspaceId'),
  body('title').optional().trim().isLength({ max: 500 }),
  body('folderId').optional().isMongoId().withMessage('Invalid folderId'),
];

router.use(authenticate);

router.get('/recent', documentController.getRecentDocuments);
router.get('/trash', documentController.getTrashedDocuments);
router.get('/', documentController.listDocuments);
router.post('/', docCreateValidator, documentController.createDocument);
router.get('/:id', documentController.getDocument);
router.patch('/:id', docMetaValidator, documentController.updateDocumentMeta);
router.post('/:id/content', documentController.saveContent);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/restore', documentController.restoreDocument);

module.exports = router;
