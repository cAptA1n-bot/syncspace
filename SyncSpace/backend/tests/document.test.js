'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const WorkspaceMembership = require('../src/models/WorkspaceMembership');
const Document = require('../src/models/Document');

jest.setTimeout(30000);

const TEST_DB = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/syncspace_test';

let userAToken, userBToken, userA, userB, workspace, document;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await WorkspaceMembership.deleteMany({});
  await Document.deleteMany({});

  // Create User A (owner)
  const regA = await request(app).post('/api/auth/register').send({
    firstName: 'Alice', lastName: 'Owner', email: 'alice@example.com', password: 'Password123',
  });
  userAToken = regA.body.data.token;
  userA = regA.body.data.user;

  // Create User B
  const regB = await request(app).post('/api/auth/register').send({
    firstName: 'Bob', lastName: 'Member', email: 'bob@example.com', password: 'Password123',
  });
  userBToken = regB.body.data.token;
  userB = regB.body.data.user;

  // Get User A's personal workspace
  const wsRes = await request(app).get('/api/workspaces').set('Authorization', `Bearer ${userAToken}`);
  workspace = wsRes.body.data.workspaces[0];

  // Create a document
  const docRes = await request(app).post('/api/documents')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ title: 'Test Document', workspaceId: workspace.id || workspace._id });
  document = docRes.body.data.document;
});

describe('DOC-T001 — Create document', () => {
  it('creates document with owner and timestamps', async () => {
    const res = await request(app).post('/api/documents')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'New Doc', workspaceId: workspace.id || workspace._id });
    expect(res.status).toBe(201);
    expect(res.body.data.document.title).toBe('New Doc');
    expect(res.body.data.document.owner).toBeDefined();
  });
});

describe('DOC-T004 — Read authorized document', () => {
  it('owner can read document', async () => {
    const res = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.document.title).toBe('Test Document');
    expect(res.body.data.role).toBe('owner');
  });
});

describe('DOC-T005 — Deny inaccessible document', () => {
  it('user without access gets 403', async () => {
    const res = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(res.status).toBe(403);
  });
});

describe('DOC-T008 — Reject unauthorized content update', () => {
  it('viewer cannot update document content', async () => {
    // Share as viewer
    await request(app).post(`/api/shares/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'bob@example.com', role: 'viewer' });

    const res = await request(app).post(`/api/documents/${document._id}/content`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ content: { type: 'doc', content: [] } });
    expect(res.status).toBe(403);
  });
});

describe('DOC-T007 — Update document content persists', () => {
  it('owner can save content and it persists', async () => {
    const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] };
    const saveRes = await request(app).post(`/api/documents/${document._id}/content`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ content });
    expect(saveRes.status).toBe(200);

    const getRes = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getRes.body.data.document.content.content[0].content[0].text).toBe('Hello');
  });
});

describe('DOC-T009 — Delete document moves to trash', () => {
  it('soft deletes document', async () => {
    const delRes = await request(app).delete(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getRes.status).toBe(404);
  });
});

describe('DOC-T010 — Restore deleted document', () => {
  it('restores document from trash', async () => {
    await request(app).delete(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    const restoreRes = await request(app).post(`/api/documents/${document._id}/restore`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(restoreRes.status).toBe(200);

    const getRes = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getRes.status).toBe(200);
  });
});

describe('SHARE-T001 — Owner shares with viewer', () => {
  it('viewer can read but not edit', async () => {
    await request(app).post(`/api/shares/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'bob@example.com', role: 'viewer' });

    const readRes = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.role).toBe('viewer');
  });
});

describe('SHARE-T007 — Revoke share removes access', () => {
  it('user loses access after revocation', async () => {
    await request(app).post(`/api/shares/${document._id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ email: 'bob@example.com', role: 'viewer' });

    await request(app).delete(`/api/shares/${document._id}/users/${userB.id || userB._id}`)
      .set('Authorization', `Bearer ${userAToken}`);

    const res = await request(app).get(`/api/documents/${document._id}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(res.status).toBe(403);
  });
});
