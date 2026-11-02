'use strict';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  COMMENTER: 'commenter',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  owner: ['read', 'write', 'comment', 'admin'],
  admin: ['read', 'write', 'comment', 'admin'],
  editor: ['read', 'write', 'comment'],
  commenter: ['read', 'comment'],
  viewer: ['read'],
};

module.exports = {
  ROLES,
  PERMISSIONS,
};

