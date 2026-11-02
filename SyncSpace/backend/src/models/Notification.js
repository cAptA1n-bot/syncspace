'use strict';

const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'document_shared',
  'document_mention',
  'comment_added',
  'comment_reply',
  'comment_mention',
  'workspace_invite',
  'workspace_role_changed',
  'workspace_removed',
  'document_access_revoked',
  'ai_summary_ready',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Polymorphic reference — use refPath
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityType: {
      type: String,
      enum: ['Document', 'Comment', 'Workspace', null],
      default: null,
    },
    message: {
      type: String,
      maxlength: 500,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
