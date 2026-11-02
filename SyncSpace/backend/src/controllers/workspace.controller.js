'use strict';

const workspaceService = require('../services/workspace.service');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { validationResult } = require('express-validator');

const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getUserWorkspaces(req.user._id);
  res.json({ success: true, data: { workspaces } });
});

const createWorkspace = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError('Validation failed', 422, errors.array());
  const { name, description } = req.body;
  const workspace = await workspaceService.createWorkspace({ name, description, userId: req.user._id });
  res.status(201).json({ success: true, data: { workspace } });
});

const getWorkspace = asyncHandler(async (req, res) => {
  const { workspace, memberRole } = await workspaceService.getWorkspace(req.params.id, req.user._id);
  res.json({ success: true, data: { workspace, memberRole } });
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: { workspace } });
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await workspaceService.getMembers(req.params.id, req.user._id);
  res.json({ success: true, data: { members } });
});

const inviteMember = asyncHandler(async (req, res) => {
  const { userId, email, role = 'member' } = req.body;

  let targetUserId = userId;
  if (!targetUserId && email) {
    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
    if (!user) throw new AppError(`User with email "${email}" not found`, 404);
    targetUserId = user._id;
  }

  if (!targetUserId) throw new AppError('Email or userId is required', 400);

  if (targetUserId.toString() === req.user._id.toString()) {
    throw new AppError('Cannot invite yourself to the workspace', 400);
  }

  const membership = await workspaceService.inviteMember(req.params.id, req.user._id, { targetUserId, role });

  try {
    await Notification.create({
      recipient: targetUserId,
      type: 'workspace_invite',
      actor: req.user._id,
      entityId: req.params.id,
      entityType: 'Workspace',
      message: `${req.user.firstName} added you to a workspace`,
    });
  } catch (err) {
    // Ignore notification error
  }

  res.status(201).json({ success: true, message: 'Member added to workspace', data: { membership } });
});

const changeMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { memberId } = req.params;
  const membership = await workspaceService.changeMemberRole(req.params.id, req.user._id, memberId, role);
  res.json({ success: true, data: { membership } });
});

const removeMember = asyncHandler(async (req, res) => {
  await workspaceService.removeMember(req.params.id, req.user._id, req.params.memberId);
  res.json({ success: true, message: 'Member removed' });
});

const leaveWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.leaveWorkspace(req.params.id, req.user._id);
  res.json({ success: true, message: 'Left workspace' });
});

module.exports = { listWorkspaces, createWorkspace, getWorkspace, updateWorkspace, getMembers, inviteMember, changeMemberRole, removeMember, leaveWorkspace };
