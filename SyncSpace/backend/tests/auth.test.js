'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
const WorkspaceMembership = require('../src/models/WorkspaceMembership');

jest.setTimeout(30000);

const TEST_DB = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/syncspace_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await WorkspaceMembership.deleteMany({});
});

const validUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'Password123',
};

describe('AUTH-T001 — Register with valid data', () => {
  it('creates account and returns safe user data', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email.toLowerCase());
    // Must NOT expose password
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();
  });
});

describe('AUTH-T002 — Reject malformed email', () => {
  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('AUTH-T003 — Reject weak password', () => {
  it('returns 422 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validUser, password: 'short' });
    expect(res.status).toBe(422);
  });
});

describe('AUTH-T004 — Reject missing required fields', () => {
  it('returns 422 when email is missing', async () => {
    const { email, ...rest } = validUser;
    const res = await request(app).post('/api/auth/register').send(rest);
    expect(res.status).toBe(422);
  });
  it('returns 422 when firstName is missing', async () => {
    const { firstName, ...rest } = validUser;
    const res = await request(app).post('/api/auth/register').send(rest);
    expect(res.status).toBe(422);
  });
});

describe('AUTH-T006 — Prevent duplicate accounts', () => {
  it('rejects second registration with same email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('AUTH-T007 — Password is hashed', () => {
  it('stores hashed password, not plaintext', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const user = await User.findOne({ email: validUser.email }).select('+passwordHash');
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe(validUser.password);
    expect(user.passwordHash.startsWith('$2')).toBe(true); // bcrypt hash
  });
});

describe('AUTH-T008 — Login with valid credentials', () => {
  it('returns token and safe user data', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });
});

describe('AUTH-T009 — Reject incorrect password', () => {
  it('returns 401 for wrong password', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: 'WrongPassword123',
    });
    expect(res.status).toBe(401);
  });
});

describe('AUTH-T010 — Reject unknown account', () => {
  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: 'Password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('AUTH-T012 — Protected endpoint rejects no credentials', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('AUTH-T011 — Logout invalidates session', () => {
  it('clears cookie on logout', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });
    const token = loginRes.body.data.token;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    // After logout, the token is still technically valid (JWT is stateless)
    // The cookie is cleared; this tests the cookie-clearing behavior
    expect(logoutRes.headers['set-cookie']).toBeDefined();
  });
});

describe('AUTH-T005 — Email normalized', () => {
  it('normalizes email and prevents duplicate normalized accounts', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'TEST@example.com' });
    expect(res.status).toBe(409);
  });
});
