'use strict';

const mongoose = require('mongoose');

/**
 * DocumentVersion — stores periodic snapshots of document content and Yjs state.
 * Used for version history and point-in-time restore.
 */
const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    revision: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Document',
    },
    content: {
      type: mongoose.Schema.Types.Mixed, // TipTap JSON snapshot
      default: null,
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    label: {
      type: String,
      maxlength: 200,
      default: null, // optional human-readable label
    },
  },
  { timestamps: true }
);

documentVersionSchema.index({ document: 1, revision: -1 });
documentVersionSchema.index({ document: 1, createdAt: -1 });

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);
module.exports = DocumentVersion;
