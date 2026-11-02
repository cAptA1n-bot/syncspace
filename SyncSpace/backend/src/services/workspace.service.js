'use strict';

const Workspace = require('../models/Workspace');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const AppError = require('../utils/AppError');
const { v4: uuidv4 } = require('uuid');

const getUserWorkspaces = async (userId) => {
  const memberships = await WorkspaceMembership.find({
    user: userId,
    inviteStatus: 'accepted',
  }).populate('workspace').lean();

  return memberships
    .filter((m) => m.workspace && !m.workspace.isDeleted)
    .map((m) => ({ ...m.workspace, memberRole: m.role }));
};

const createWorkspace = async ({ name, description, userId }) => {
  const workspace = await Workspace.create({ name, description, owner: userId });
  await WorkspaceMembership.create({
    workspace: workspace._id,
    user: userId,
    role: 'owner',
    inviteStatus: 'accepted',
  });
  return workspace;
};

const getWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace || workspace.isDeleted) throw new AppError('Workspace not found', 404);

  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: userId,
    inviteStatus: 'accepted',
  }).lean();

  if (!membership) throw new AppError('Workspace access denied', 403);
  return { workspace, memberRole: membership.role };
};

const updateWorkspace = async (workspaceId, userId, updates) => {
  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: userId,
    inviteStatus: 'accepted',
    role: { $in: ['owner', 'admin'] },
  });
  if (!membership) throw new AppError('Admin access required', 403);

  const allowed = ['name', 'description', 'avatar'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  return Workspace.findByIdAndUpdate(workspaceId, sanitized, { new: true, runValidators: true }).lean();
};

const getMembers = async (workspaceId, userId) => {
  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: userId,
    inviteStatus: 'accepted',
  });
  if (!membership) throw new AppError('Workspace access denied', 403);

  return WorkspaceMembership.find({
    workspace: workspaceId,
    inviteStatus: { $in: ['accepted', 'pending'] },
  }).populate('user', 'firstName lastName email avatar').lean();
};

const inviteMember = async (workspaceId, inviterId, { targetUserId, role }) => {
  const inviterMembership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: inviterId,
    inviteStatus: 'accepted',
    role: { $in: ['owner', 'admin'] },
  });
  if (!inviterMembership) throw new AppError('Admin access required to invite members', 403);

  const existing = await WorkspaceMembership.findOne({ workspace: workspaceId, user: targetUserId });
  if (existing) {
    if (existing.inviteStatus === 'accepted') throw new AppError('User is already a member', 409);
    // Re-invite
    existing.role = role || 'member';
    existing.inviteStatus = 'accepted';
    existing.invitedBy = inviterId;
    await existing.save();
    return existing;
  }

  return WorkspaceMembership.create({
    workspace: workspaceId,
    user: targetUserId,
    role: role || 'member',
    invitedBy: inviterId,
    inviteStatus: 'accepted',
  });
};

const changeMemberRole = async (workspaceId, actorId, targetUserId, newRole) => {
  const actorMembership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: actorId,
    inviteStatus: 'accepted',
    role: 'owner',
  });
  if (!actorMembership) throw new AppError('Only the workspace owner can change roles', 403);

  if (actorId.toString() === targetUserId.toString()) {
    throw new AppError('Cannot change your own role', 400);
  }

  const target = await WorkspaceMembership.findOneAndUpdate(
    { workspace: workspaceId, user: targetUserId },
    { role: newRole },
    { new: true }
  );
  if (!target) throw new AppError('Member not found', 404);
  return target;
};

const removeMember = async (workspaceId, actorId, targetUserId) => {
  const actorMembership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: actorId,
    inviteStatus: 'accepted',
    role: { $in: ['owner', 'admin'] },
  });
  if (!actorMembership) throw new AppError('Admin access required', 403);

  if (actorId.toString() === targetUserId.toString()) {
    throw new AppError('Cannot remove yourself. Use leave workspace instead.', 400);
  }

  const target = await WorkspaceMembership.findOne({ workspace: workspaceId, user: targetUserId });
  if (!target) throw new AppError('Member not found', 404);
  if (target.role === 'owner') throw new AppError('Cannot remove the workspace owner', 403);

  await WorkspaceMembership.deleteOne({ workspace: workspaceId, user: targetUserId });
};

const leaveWorkspace = async (workspaceId, userId) => {
  const membership = await WorkspaceMembership.findOne({ workspace: workspaceId, user: userId });
  if (!membership) throw new AppError('You are not a member of this workspace', 400);
  if (membership.role === 'owner') {
    throw new AppError('Workspace owners must transfer ownership before leaving', 400);
  }
  await WorkspaceMembership.deleteOne({ workspace: workspaceId, user: userId });
};

module.exports = {
  getUserWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  getMembers,
  inviteMember,
  changeMemberRole,
  removeMember,
  leaveWorkspace,
};
