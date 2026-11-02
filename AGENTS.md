# AGENTS.md — SyncSpace

## Purpose
This file gives coding agents and contributors the working rules for the SyncSpace repository. Follow it before making changes.

## Product summary
SyncSpace is a collaborative workspace for individuals and small teams. It combines rich-text documents, real-time editing, workspaces, secure sharing, file attachments, and later AI-powered productivity features, including document summarization.

## Current product decisions
- Product direction: hybrid collaborative workspace inspired by document editors and knowledge workspaces.
- Initial audience: startups and small teams, while supporting personal use.
- Editor direction: block-based rich-text documents, with an initial practical set of blocks.
- Collaboration: individual document sharing plus team workspaces.
- File scope initially: documents, images, and common attachments; not a full cloud-drive replacement in the first release.
- AI: add after core collaboration is dependable. AI document summarization is explicitly in the product roadmap.
- Frontend: React-based application; use JavaScript/JSX unless the repository's existing code clearly establishes otherwise.
- Backend: Node.js and Express.
- Database: MongoDB.
- Real-time collaboration: evaluate Yjs/CRDT-based synchronization. Socket.IO may be used for presence, application events, and/or transport where compatible; do not assume plain broadcast events alone solve concurrent editing.
- File binaries should generally live in object storage; MongoDB stores metadata and storage keys.

## Rules for agents
1. Read `project.md`, `projectContext.md`, `projectPlan.md`, `projectStatus.md`, and `projectTest.md` before making architectural changes.
2. Inspect the existing repository before proposing or changing its structure. Preserve working code and conventions where practical.
3. Do not silently replace established dependencies, module systems, or naming conventions. Explain meaningful changes.
4. Keep changes focused and avoid unrelated refactors.
5. Validate all inputs on the server. Never rely on frontend-only validation or hidden UI controls for security.
6. Enforce authorization on every protected API, document operation, file operation, and real-time room join.
7. Never expose secrets, credentials, private document content, access tokens, or environment variable values in logs or responses.
8. Use environment variables for secrets and environment-specific configuration. Keep `.env` out of version control; provide `.env.example` with placeholder values.
9. Use secure password hashing, safe cookie settings, rate limiting, and appropriate CORS configuration.
10. Treat document persistence and recovery as critical. Do not claim a save succeeded until the chosen persistence strategy confirms it.
11. For collaborative editing, test concurrent changes, reconnects, duplicate/reordered events, and persistence/reload behavior.
12. Add or update tests for behavior changes. Prefer tests for authorization boundaries and failure cases, not only happy paths.
13. Use accessible labels, keyboard navigation, responsive layouts, and meaningful loading/empty/error states.
14. Avoid introducing AI, billing, enterprise, offline-first, or other future scope into the MVP unless explicitly approved.
15. Do not store document file binaries directly in MongoDB by default. Discuss exceptions before implementation.
16. Keep docs current when product decisions, architecture, APIs, milestones, or test coverage change.

## Definition of done
A change is done when:
- Acceptance criteria are met.
- Relevant automated tests pass.
- Authorization and failure paths are tested where relevant.
- Linting/formatting checks pass if configured.
- No secrets or real user data are committed.
- Documentation and examples are updated.
- Known limitations are stated clearly.

## Suggested contribution workflow
1. Identify the feature and acceptance criteria.
2. Read the relevant model, service, controller, route, and UI code.
3. Write or update tests.
4. Implement the smallest cohesive change.
5. Run targeted tests, then the wider test suite.
6. Update `projectStatus.md` and related documentation.
7. Summarize changes, tests run, results, and remaining risks.
