'use strict';

const mongoose = require('mongoose');

/**
 * AiSummary — caches AI-generated summaries keyed by document + revision + type.
 * Stale summaries are identified by comparing document.aiSummaryRevision.
 */
const aiSummarySchema = new mongoose.Schema(
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
    summaryType: {
      type: String,
      enum: ['short', 'medium', 'detailed', 'key_points', 'action_items'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      default: 'gemini',
    },
    isStale: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    },
  },
  { timestamps: true }
);

aiSummarySchema.index({ document: 1, revision: 1, summaryType: 1 }, { unique: true });
aiSummarySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const AiSummary = mongoose.model('AiSummary', aiSummarySchema);
module.exports = AiSummary;
