'use strict';

const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');
const Workspace = require('../models/Workspace');
const WorkspaceMembership = require('../models/WorkspaceMembership');
const AppError = require('../utils/AppError');

/**
 * Determine the effective role of a user on a document.
 * Returns: 'owner' | 'editor' | 'commenter' | 'viewer' | null
 */
const getDocumentRole = async (documentId, userId) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc || doc.isDeleted) return null;

  // Owner
  if (doc.owner.toString() === userId.toString()) return 'owner';

  // Direct collaborator
  const collab = doc.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );
  if (collab) return collab.role;

  // Workspace member — check if workspace is accessible
  const membership = await WorkspaceMembership.findOne({
    workspace: doc.workspace,
    user: userId,
    inviteStatus: 'accepted',
  }).lean();

  if (membership) {
    // Workspace members get 'viewer' by default unless explicitly added
    return 'viewer';
  }

  return null;
};

/**
 * Check if a user can perform a given action on a document.
 * Actions: 'read' | 'write' | 'comment' | 'admin'
 */
const canPerformAction = (role, action) => {
  if (!role) return false;
  const permissions = {
    owner: ['read', 'write', 'comment', 'admin'],
    editor: ['read', 'write', 'comment'],
    commenter: ['read', 'comment'],
    viewer: ['read'],
  };
  return (permissions[role] || []).includes(action);
};

/**
 * Create a new document.
 */
const createDocument = async ({ title, workspaceId, folderId, userId }) => {
  // Verify workspace membership
  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: userId,
    inviteStatus: 'accepted',
  });
  if (!membership) throw new AppError('Workspace access denied', 403);

  const doc = await Document.create({
    title: title || 'Untitled Document',
    workspace: workspaceId,
    owner: userId,
    folder: folderId || null,
    content: null,
    revision: 0,
  });

  return doc;
};

/**
 * Get a single document by ID with access check.
 */
const getDocument = async (documentId, userId) => {
  const doc = await Document.findById(documentId)
    .populate('owner', 'firstName lastName email avatar')
    .populate('collaborators.user', 'firstName lastName email avatar')
    .populate('lastEditedBy', 'firstName lastName email')
    .lean();

  if (!doc || doc.isDeleted) throw new AppError('Document not found', 404);

  const role = await getDocumentRole(documentId, userId);
  if (!canPerformAction(role, 'read')) {
    throw new AppError('Access denied', 403);
  }

  return { doc, role };
};

/**
 * List documents accessible by a user in a workspace.
 */
const listDocuments = async ({ workspaceId, userId, folderId, page = 1, limit = 50, sort = '-updatedAt' }) => {
  // Verify membership
  const membership = await WorkspaceMembership.findOne({
    workspace: workspaceId,
    user: userId,
    inviteStatus: 'accepted',
  });
  if (!membership) throw new AppError('Workspace access denied', 403);

  const filter = {
    workspace: workspaceId,
    isDeleted: false,
  };

  if (folderId !== undefined) {
    filter.folder = folderId || null;
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Document.find(filter)
      .select('-yjsState -content')
      .populate('owner', 'firstName lastName email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);

  return {
    docs,
    documents: docs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get recent documents for a user across all workspaces.
 */
const getRecentDocuments = async (userId, limit = 10) => {
  const docs = await Document.find({
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
    isDeleted: false,
  })
    .select('-yjsState -content')
    .populate('owner', 'firstName lastName email avatar')
    .sort({ lastAccessedAt: -1 })
    .limit(limit)
    .lean();

  return docs;
};

/**
 * Update document metadata (title, folder, icon, cover).
 */
const updateDocumentMeta = async (documentId, userId, updates) => {
  const role = await getDocumentRole(documentId, userId);
  if (!canPerformAction(role, 'write')) throw new AppError('Write access required', 403);

  const allowed = ['title', 'folder', 'icon', 'coverImage', 'isFavorited'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const doc = await Document.findByIdAndUpdate(
    documentId,
    { ...sanitized, lastEditedBy: userId },
    { new: true, runValidators: true }
  )
    .select('-yjsState')
    .populate('owner', 'firstName lastName email avatar')
    .lean();

  if (!doc) throw new AppError('Document not found', 404);
  return doc;
};

/**
 * Save document content (TipTap JSON) and optionally create a version snapshot.
 */
const saveDocumentContent = async (documentId, userId, { content, yjsState, createVersion = false }) => {
  const role = await getDocumentRole(documentId, userId);
  if (!canPerformAction(role, 'write')) throw new AppError('Write access required', 403);

  const existing = await Document.findById(documentId).select('revision title');
  if (!existing) throw new AppError('Document not found', 404);

  const newRevision = existing.revision + 1;

  const updateData = {
    revision: newRevision,
    aiSummaryRevision: newRevision, // invalidate AI cache on content change
    lastEditedBy: userId,
    lastAccessedAt: new Date(),
  };

  if (content !== undefined) updateData.content = content;
  if (yjsState !== undefined) updateData.yjsState = yjsState;

  const doc = await Document.findByIdAndUpdate(documentId, updateData, { new: true })
    .select('-yjsState');

  // Create version snapshot if requested (e.g., periodic autosave)
  if (createVersion) {
    await DocumentVersion.create({
      document: documentId,
      revision: newRevision,
      title: existing.title,
      content: content || null,
      yjsState: yjsState || null,
      createdBy: userId,
    });
  }

  return doc;
};

/**
 * Soft-delete a document (move to trash).
 */
const deleteDocument = async (documentId, userId) => {
  const role = await getDocumentRole(documentId, userId);
  if (role !== 'owner') throw new AppError('Only the document owner can delete it', 403);

  await Document.findByIdAndUpdate(documentId, {
    isDeleted: true,
    deletedAt: new Date(),
  });
};

/**
 * Restore a document from trash.
 */
const restoreDocument = async (documentId, userId) => {
  const doc = await Document.findById(documentId).lean();
  if (!doc) throw new AppError('Document not found', 404);
  if (!doc.isDeleted) throw new AppError('Document is not in trash', 400);
  if (doc.owner.toString() !== userId.toString()) throw new AppError('Only the owner can restore this document', 403);

  await Document.findByIdAndUpdate(documentId, {
    isDeleted: false,
    deletedAt: null,
  });
};

/**
 * List documents in trash for a user.
 */
const getTrashedDocuments = async (userId) => {
  return Document.find({
    owner: userId,
    isDeleted: true,
  })
    .select('-yjsState -content')
    .populate('owner', 'firstName lastName email')
    .sort({ deletedAt: -1 })
    .lean();
};

/**
 * Get document's Yjs binary state for collaboration bootstrap.
 */
const getDocumentYjsState = async (documentId, userId) => {
  const role = await getDocumentRole(documentId, userId);
  if (!canPerformAction(role, 'read')) throw new AppError('Access denied', 403);

  const doc = await Document.findById(documentId).select('yjsState revision').lean();
  if (!doc) throw new AppError('Document not found', 404);
  return { yjsState: doc.yjsState, revision: doc.revision };
};

/**
 * Update last accessed timestamp.
 */
const touchDocument = async (documentId) => {
  await Document.findByIdAndUpdate(documentId, { lastAccessedAt: new Date() });
};

module.exports = {
  getDocumentRole,
  canPerformAction,
  createDocument,
  getDocument,
  listDocuments,
  getRecentDocuments,
  updateDocumentMeta,
  saveDocumentContent,
  deleteDocument,
  restoreDocument,
  getTrashedDocuments,
  getDocumentYjsState,
  touchDocument,
};
