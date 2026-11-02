'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name must be 50 characters or fewer'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name must be 50 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must be 500 characters or fewer'],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// email has unique: true above
userSchema.index({ isDeleted: 1 });

// ─── Instance methods ─────────────────────────────────────────────────────────

/** Verify a plaintext password against the stored hash */
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

/** Return safe public profile */
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt,
  };
};

// ─── Statics ──────────────────────────────────────────────────────────────────

/**
 * Hash a plaintext password.
 * @param {string} password
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = async function (password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
