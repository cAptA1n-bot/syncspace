'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const lib0 = require('lib0/encoding');
const lib0Decoding = require('lib0/decoding');
const User = require('../models/User');
const Document = require('../models/Document');
const documentService = require('../services/document.service');
const logger = require('../utils/logger');

// Message types (matches y-websocket protocol)
const messageSync = 0;
const messageAwareness = 1;

/**
 * In-memory map of documentId → { ydoc, awareness, clients: Map<socketId, {userId, user}> }
 * For production with multiple servers, use a Redis-backed y-leveldb provider or similar.
 */
const rooms = new Map();

const getOrCreateRoom = (documentId) => {
  if (!rooms.has(documentId)) {
    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);

    rooms.set(documentId, {
      ydoc,
      awareness,
      clients: new Map(), // socketId → { userId, user }
      saveTimeout: null,
    });
  }
  return rooms.get(documentId);
};

/**
 * Authenticate socket connection via cookie or handshake auth token.
 */
const authenticateSocket = async (socket) => {
  let token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.cookie?.split('; ')
      .find((c) => c.startsWith('token='))
      ?.split('=')[1];

  if (!token) throw new Error('No auth token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'syncspace_fallback_jwt_secret_dev_and_tests');
  } catch {
    throw new Error('Invalid token');
  }

  const user = await User.findById(decoded.id).select('firstName lastName email avatar isDeleted').lean();
  if (!user || user.isDeleted) throw new Error('User not found');
  return user;
};

/**
 * Persist Yjs state to MongoDB (debounced).
 */
const schedulePersist = (documentId, ydoc) => {
  const room = rooms.get(documentId);
  if (!room) return;

  if (room.saveTimeout) clearTimeout(room.saveTimeout);
  room.saveTimeout = setTimeout(async () => {
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await Document.findByIdAndUpdate(documentId, { yjsState: Buffer.from(state) });
      logger.info(`[Collab] Persisted Yjs state for document ${documentId}`);
    } catch (err) {
      logger.error('[Collab] Persistence error:', err.message);
    }
  }, 2000); // debounce 2 seconds
};

/**
 * Load initial Yjs state from MongoDB when first client joins.
 */
const loadDocumentState = async (documentId, ydoc) => {
  try {
    const doc = await Document.findById(documentId).select('yjsState').lean();
    if (doc?.yjsState && doc.yjsState.length > 0) {
      Y.applyUpdate(ydoc, new Uint8Array(doc.yjsState));
      logger.info(`[Collab] Loaded Yjs state for document ${documentId}`);
    }
  } catch (err) {
    logger.error('[Collab] Error loading document state:', err.message);
  }
};

/**
 * Broadcast Yjs update to all other clients in a room.
 */
const broadcastUpdate = (room, sender, update, type) => {
  for (const [socketId, { socket: clientSocket }] of room.clients) {
    if (socketId !== sender.id) {
      const encoder = lib0.createEncoder();
      lib0.writeVarUint(encoder, type);
      lib0.writeVarUint8Array(encoder, update);
      clientSocket.emit('sync-message', lib0.toUint8Array(encoder));
    }
  }
};

/**
 * Send sync step 1 to a newly joined client.
 */
const sendSyncStep1 = (socket, ydoc) => {
  const encoder = lib0.createEncoder();
  lib0.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, ydoc);
  socket.emit('sync-message', lib0.toUint8Array(encoder));
};

/**
 * Send current awareness state to a newly joined client.
 */
const sendAwareness = (socket, awareness) => {
  const encoder = lib0.createEncoder();
  lib0.writeVarUint(encoder, messageAwareness);
  lib0.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
  );
  socket.emit('sync-message', lib0.toUint8Array(encoder));
};

/**
 * Initialize Socket.IO and attach collaboration handlers.
 */
const initSocketIO = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, ''))
    .filter(Boolean);

  const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const clean = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes('*') || allowedOrigins.includes(clean)) return true;
    if (/\.vercel\.app$/.test(clean)) return true;
    for (const item of allowedOrigins) {
      if (item.includes('*')) {
        const regex = new RegExp('^' + item.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        if (regex.test(clean)) return true;
      }
    }
    return false;
  };

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          logger.warn(`[Socket.IO CORS] Blocked origin: ${origin}`);
          callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ─── Collaboration namespace ─────────────────────────────────────────────
  const collabNS = io.of('/collab');

  collabNS.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = user;
      next();
    } catch (err) {
      logger.warn('[Socket] Auth failed:', err.message);
      next(new Error('Unauthorized'));
    }
  });

  collabNS.on('connection', async (socket) => {
    logger.info(`[Collab] Socket connected: ${socket.id} user:${socket.user._id}`);

    // ── Join document room ─────────────────────────────────────────────────
    socket.on('join-document', async ({ documentId }) => {
      try {
        if (!documentId) return socket.emit('error', { message: 'documentId required' });

        // Authorization check
        const role = await documentService.getDocumentRole(documentId, socket.user._id);
        if (!documentService.canPerformAction(role, 'read')) {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.currentDocumentId = documentId;
        socket.documentRole = role;

        const room = getOrCreateRoom(documentId);

        // Load state from DB on first join
        if (room.clients.size === 0) {
          await loadDocumentState(documentId, room.ydoc);
        }

        // Register client
        room.clients.set(socket.id, { userId: socket.user._id, user: socket.user, socket });
        socket.join(documentId);

        // Send sync step 1
        sendSyncStep1(socket, room.ydoc);

        // Send current awareness
        if (room.awareness.getStates().size > 0) {
          sendAwareness(socket, room.awareness);
        }

        // Broadcast presence to others
        socket.to(documentId).emit('presence-update', {
          users: getPresenceList(room),
        });

        socket.emit('joined', {
          documentId,
          role,
          user: {
            id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            avatar: socket.user.avatar,
          },
          collaborators: getPresenceList(room),
        });

        logger.info(`[Collab] User ${socket.user._id} joined document ${documentId} as ${role}`);
      } catch (err) {
        logger.error('[Collab] join-document error:', err.message);
        socket.emit('error', { message: 'Failed to join document' });
      }
    });

    // ── Sync message (Yjs protocol) ────────────────────────────────────────
    socket.on('sync-message', async (data) => {
      try {
        const documentId = socket.currentDocumentId;
        if (!documentId) return;

        const room = rooms.get(documentId);
        if (!room) return;

        const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        const decoder = lib0Decoding.createDecoder(uint8);
        const msgType = lib0Decoding.readVarUint(decoder);

        if (msgType === messageSync) {
          const encoder = lib0.createEncoder();
          lib0.writeVarUint(encoder, messageSync);

          const syncMsgType = syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, null);

          // If we replied with anything, send it back to the sender
          if (lib0.length(encoder) > 1) {
            socket.emit('sync-message', lib0.toUint8Array(encoder));
          }

          // Broadcast updates to other clients (syncMsgType 2 = update)
          if (syncMsgType === 2) {
            // Re-read the update to broadcast
            const updateDecoder = lib0Decoding.createDecoder(uint8);
            lib0Decoding.readVarUint(updateDecoder); // skip type
            lib0Decoding.readVarUint(updateDecoder); // skip sync msg type
            const update = lib0Decoding.readVarUint8Array(updateDecoder);

            // Broadcast to others
            for (const [sid, { socket: clientSocket }] of room.clients) {
              if (sid !== socket.id) {
                clientSocket.emit('sync-message', uint8);
              }
            }

            // Re-check write permission
            const role = socket.documentRole;
            if (documentService.canPerformAction(role, 'write')) {
              schedulePersist(documentId, room.ydoc);
            }
          }
        } else if (msgType === messageAwareness) {
          const update = lib0Decoding.readVarUint8Array(decoder);

          awarenessProtocol.applyAwarenessUpdate(room.awareness, update, socket);

          // Broadcast awareness to everyone including sender
          for (const [sid, { socket: clientSocket }] of room.clients) {
            if (sid !== socket.id) {
              clientSocket.emit('sync-message', uint8);
            }
          }
        }
      } catch (err) {
        logger.error('[Collab] sync-message error:', err.message);
      }
    });

    // ── Leave document room ────────────────────────────────────────────────
    const leaveDocument = (documentId) => {
      if (!documentId) return;
      const room = rooms.get(documentId);
      if (!room) return;

      room.clients.delete(socket.id);
      socket.leave(documentId);

      // Remove awareness for this client
      awarenessProtocol.removeAwarenessStates(room.awareness, [socket.id], null);

      // Broadcast updated presence
      socket.to(documentId).emit('presence-update', { users: getPresenceList(room) });

      // Clean up empty rooms
      if (room.clients.size === 0) {
        if (room.saveTimeout) clearTimeout(room.saveTimeout);
        // Final persist before cleanup
        const state = Y.encodeStateAsUpdate(room.ydoc);
        Document.findByIdAndUpdate(documentId, { yjsState: Buffer.from(state) }).catch(() => {});
        rooms.delete(documentId);
        logger.info(`[Collab] Room ${documentId} cleaned up`);
      }
    };

    socket.on('leave-document', () => leaveDocument(socket.currentDocumentId));
    socket.on('disconnect', () => {
      leaveDocument(socket.currentDocumentId);
      logger.info(`[Collab] Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Notifications namespace ─────────────────────────────────────────────
  const notifNS = io.of('/notifications');
  notifNS.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  notifNS.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);
    logger.info(`[Notif] User ${socket.user._id} connected`);
    socket.on('disconnect', () => {});
  });

  // Expose notification emitter for services
  io.emitNotification = (userId, notification) => {
    notifNS.to(`user:${userId}`).emit('notification', notification);
  };

  global.io = io; // Make available to services

  return io;
};

/**
 * Get presence list for a room (safe fields only).
 */
const getPresenceList = (room) => {
  const users = [];
  for (const [, { user }] of room.clients) {
    users.push({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    });
  }
  return users;
};

module.exports = { initSocketIO };
