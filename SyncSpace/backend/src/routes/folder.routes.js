'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Folder = require('../models/Folder');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const { body, validationResult } = require('express-validator');

router.use(authenticate);

/** GET /api/folders?workspaceId=&parentId= */
router.get('/', asyncHandler(async (req, res) => {
  const { workspaceId, parentId } = req.query;
  if (!workspaceId) throw new AppError('workspaceId required', 400);

  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: req.user._id,
    inviteStatus: 'accepted',
  });
  if (!membership) throw new AppError('Workspace access denied', 403);

  const filter = {
    workspace: workspaceId,
    isDeleted: false,
    owner: req.user._id,
  };
  if (parentId !== undefined) filter.parent = parentId || null;

  const folders = await Folder.find(filter).sort({ name: 1 }).lean();
  res.json({ success: true, data: { folders } });
}));

/** POST /api/folders */
router.post('/', [
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('workspaceId').isMongoId(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());

  const { name, workspaceId, parentId } = req.body;

  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: req.user._id,
    inviteStatus: 'accepted',
  });
  if (!membership) throw new AppError('Workspace access denied', 403);

  // Prevent cycles — simple: parent must not be a descendant of this folder
  if (parentId) {
    const parent = await Folder.findById(parentId);
    if (!parent || parent.workspace.toString() !== workspaceId) {
      throw new AppError('Invalid parent folder', 400);
    }
  }

  const folder = await Folder.create({
    name,
    workspace: workspaceId,
    owner: req.user._id,
    parent: parentId || null,
  });

  res.status(201).json({ success: true, data: { folder } });
}));

/** PATCH /api/folders/:id */
router.patch('/:id', asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!folder || folder.isDeleted) throw new AppError('Folder not found', 404);

  if (req.body.name) folder.name = req.body.name.trim();
  if (req.body.parentId !== undefined) folder.parent = req.body.parentId || null;
  await folder.save();

  res.json({ success: true, data: { folder } });
}));

/** DELETE /api/folders/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!folder || folder.isDeleted) throw new AppError('Folder not found', 404);

  folder.isDeleted = true;
  folder.deletedAt = new Date();
  await folder.save();

  res.json({ success: true, message: 'Folder deleted' });
}));

module.exports = router;
