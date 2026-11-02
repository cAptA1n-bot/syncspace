'use strict';

const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [1, 'Workspace name cannot be empty'],
      maxlength: [100, 'Workspace name must be 100 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be 500 characters or fewer'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPersonal: {
      type: Boolean,
      default: false,
    },
    avatar: {
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

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ isDeleted: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
