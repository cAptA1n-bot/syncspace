'use strict';

const mongoose = require('mongoose');

const ROLES = ['owner', 'admin', 'member', 'guest', 'viewer'];

const workspaceMembershipSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'member',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inviteToken: {
      type: String,
      default: null,
      select: false,
    },
    inviteTokenExpiry: {
      type: Date,
      default: null,
    },
    inviteStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'revoked'],
      default: 'accepted',
    },
  },
  { timestamps: true }
);

// One membership per user per workspace
workspaceMembershipSchema.index({ workspace: 1, user: 1 }, { unique: true });
workspaceMembershipSchema.index({ inviteToken: 1 });

const WorkspaceMembership = mongoose.model('WorkspaceMembership', workspaceMembershipSchema);
module.exports = WorkspaceMembership;
module.exports.ROLES = ROLES;
