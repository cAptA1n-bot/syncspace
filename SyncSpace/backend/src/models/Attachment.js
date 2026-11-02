'use strict';

const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number, // bytes
      required: true,
    },
    // Where the file is stored (local path or object storage key)
    storageKey: {
      type: String,
      required: true,
    },
    // 'local' | 's3' | 'gcs'
    storageProvider: {
      type: String,
      default: 'local',
    },
    // Public URL if applicable (signed or CDN)
    url: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

attachmentSchema.index({ document: 1, isDeleted: 1 });
attachmentSchema.index({ uploadedBy: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);
module.exports = Attachment;
