'use strict';

const mongoose = require('mongoose');

/**
 * Document model — stores rich-text content as structured JSON (TipTap/ProseMirror JSON).
 * Yjs state is persisted separately in DocumentVersion for collaboration.
 */
const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [500, 'Title must be 500 characters or fewer'],
      default: 'Untitled Document',
    },
    content: {
      type: mongoose.Schema.Types.Mixed, // TipTap JSON doc
      default: null,
    },
    // Yjs binary state for real-time collaboration
    yjsState: {
      type: Buffer,
      default: null,
      select: false, // large binary, load explicitly
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    // Collaborators with inline roles for quick lookup
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['viewer', 'commenter', 'editor'], default: 'viewer' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    // Link-based sharing
    shareLink: {
      token: { type: String, default: null },
      role: { type: String, enum: ['viewer', 'commenter', 'editor'], default: 'viewer' },
      enabled: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isFavorited: {
      type: Boolean,
      default: false,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Current revision counter — incremented on each meaningful save
    revision: {
      type: Number,
      default: 0,
    },
    // AI summary cache invalidation key
    aiSummaryRevision: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
documentSchema.index({ workspace: 1, isDeleted: 1 });
documentSchema.index({ owner: 1, isDeleted: 1 });
documentSchema.index({ 'collaborators.user': 1 });
documentSchema.index({ 'shareLink.token': 1 });
documentSchema.index({ folder: 1 });
documentSchema.index({ title: 'text' }); // text search on titles
documentSchema.index({ lastAccessedAt: -1 });
documentSchema.index({ updatedAt: -1 });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
