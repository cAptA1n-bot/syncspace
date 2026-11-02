# SyncSpace — Project Context

## Purpose of this document
A compact handoff document for contributors, coding agents, and future sessions. It records product decisions and the technical context known so far. Verify current repository code before treating any implementation detail as current.

## Product decisions already agreed
- SyncSpace is a hybrid collaborative workspace: real-time documents plus workspace/team organization.
- Initial target audience is startups and small teams, while supporting personal workspaces.
- Use block-based rich-text documents, introduced incrementally.
- Support both individual document sharing and team workspaces.
- Initially support documents, images, and common attachments rather than attempting full cloud-drive parity.
- Add AI after the core collaboration experience is stable.
- AI document summarization is explicitly approved and must be included in the roadmap.
- Suggested summary outputs: short, medium, detailed, key points, and action items where applicable.
- AI must not modify the original document automatically.
- Initial frontend code should use JavaScript/JSX unless the repository already establishes a different convention.

## Previously reported implementation context
The project has previously been described as using:
- Node.js and Express backend
- MongoDB database
- `app.js` to configure Express and connect to the database
- `server.js` to create an HTTP server and listen on `process.env.PORT || 3000`
- An initial root route returning a simple response
- User model with first and last name fields
- Registration flow using `validator` for email/password validation, `bcrypt` for password hashing, and JWT authentication
- A folder split involving routes, controllers, and services
- Socket.IO not yet configured at the time it was last discussed

These are historical notes, not a guarantee that the latest repository still matches them. Inspect the actual source before coding.

## Suggested backend organization
Adapt this to the current codebase rather than blindly replacing existing structure.

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    validators/
    utils/
    sockets/
    app.js
    server.js
  tests/
  .env.example
```

## Suggested frontend organization
Adapt to the frontend framework and existing repository layout.

```text
frontend/
  src/
    app-or-pages/
    components/
    features/
      auth/
      workspaces/
      documents/
      editor/
      sharing/
      comments/
      notifications/
      ai-summary/
    hooks/
    lib/
    services/
    styles/
  tests/
```

## Important architectural guidance
- Keep controllers thin; put business logic in services.
- Validate request bodies, query parameters, route parameters, and uploaded files.
- Centralize authentication and authorization middleware.
- Check authorization at every data-access boundary.
- Treat document content as structured editor data, not arbitrary trusted HTML.
- Sanitize rendered content and URLs.
- Define a clear source of truth for collaborative document state and persistence.
- Do not use ordinary Socket.IO message broadcasting as the sole concurrency-control mechanism.
- Keep presence state ephemeral; persist document state durably.
- Ensure revoked access applies to HTTP APIs and active collaboration sessions.
- Store uploaded binaries in object storage when practical; keep metadata and storage keys in MongoDB.
- Keep AI provider calls behind an internal service so providers can be changed without rewriting application logic.
- Use revision identifiers to avoid returning stale AI summaries.

## Suggested environment variables
Only add variables actually used by the implementation. Example placeholders should never contain real secrets.

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=
JWT_SECRET=
CLIENT_ORIGIN=http://localhost:5173
# Optional, only if used:
REDIS_URL=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
AI_PROVIDER=
AI_API_KEY=
```

## Repository onboarding checklist
- [ ] Inspect root directories and package manifests.
- [ ] Identify frontend and backend entry points.
- [ ] Identify module system and existing naming conventions.
- [ ] Inspect authentication, models, routes, and error handling.
- [ ] Identify current document schema and editor library.
- [ ] Identify current persistence strategy.
- [ ] Identify existing tests and test commands.
- [ ] Compare actual implementation with `projectStatus.md`.
- [ ] Update docs when verified facts differ from these historical notes.
