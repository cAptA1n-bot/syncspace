# SyncSpace — Project Plan

## Planning principles
- Build in small vertical slices.
- Validate the architecture with working prototypes before broad implementation.
- Treat authentication, authorization, collaboration integrity, and persistence as foundational.
- Keep AI summarization in the plan, but do not delay core reliability to ship it early.
- Each phase has exit criteria. Do not advance solely because code has been written.

## Phase 0 — Repository audit and product foundation
### Work
- Inspect the existing repository and dependencies.
- Confirm frontend/backend layout, module system, scripts, and current tests.
- Record actual architecture and update project status.
- Define initial data models and API conventions.
- Establish environment configuration and `.env.example`.
### Exit criteria
- Project can be installed and run locally using documented steps.
- Baseline test command exists or a decision to add one is recorded.
- No secrets are committed.

## Phase 1 — Authentication and account foundation
### Work
- Registration, login, logout, current-user endpoint.
- Password hashing and validation.
- Secure authentication cookies/session handling.
- Centralized error handling and authentication middleware.
- Profile basics and password reset design.
### Exit criteria
- Auth happy paths and failure paths pass tests.
- Protected endpoints reject missing/invalid credentials.
- Cookie, CORS, and environment configuration are reviewed.

## Phase 2 — Workspace and document foundation
### Work
- Personal workspace and membership model.
- Document and folder models.
- Create/list/read/rename/update/delete document APIs.
- Ownership and access checks.
- Trash and restore basics.
- Dashboard and document navigation.
### Exit criteria
- Users can create and reopen documents.
- Cross-user data isolation is tested.
- Document updates persist across reloads.

## Phase 3 — Editor and durable persistence
### Work
- Select editor library and structured content format.
- Implement initial blocks: paragraph, headings, lists, links, image.
- Implement autosave and visible saving/saved/error states.
- Add content validation and safe rendering.
### Exit criteria
- Supported content survives refresh and relogin.
- Save failures are visible and recoverable.
- Malformed or unsafe content is handled safely.

## Phase 4 — Real-time collaboration
### Work
- Prototype Yjs/CRDT-based shared document state and provider.
- Add collaborator presence and cursors.
- Add authentication and authorization to collaboration sessions.
- Persist shared document state and recover after restart.
- Test concurrent edits, reconnects, duplicate events, and multiple tabs.
### Exit criteria
- Concurrent edits converge without silent data loss.
- Authorized users can collaborate; unauthorized users cannot join.
- Server restart and reconnect do not lose confirmed durable edits.

## Phase 5 — Sharing and permissions
### Work
- Share with specific users.
- Viewer and editor roles; commenter role when comments are ready.
- Share-link design and revocation.
- Permission checks for HTTP and real-time actions.
### Exit criteria
- Permission matrix tests pass.
- Revoked users lose access on subsequent requests and active sessions.
- Link access cannot bypass intended restrictions.

## Phase 6 — Files and attachments
### Work
- Image and attachment upload.
- File metadata and object-storage integration.
- Validate MIME type, size, authorization, and file ownership.
- Download/preview for selected safe formats.
### Exit criteria
- Unauthorized uploads/downloads are rejected.
- Invalid and oversized files are rejected.
- Deleting metadata and cleaning storage are handled safely.

## Phase 7 — Comments, notifications, and revision history
### Work
- Threaded comments and replies.
- Mentions and in-app notifications.
- Revision checkpoints, revision list, and restore.
- Activity events for meaningful actions.
### Exit criteria
- Comments and notifications respect access permissions.
- Restoring a revision creates a safe, auditable state transition.
- Notification failures do not break primary document operations.

## Phase 8 — Search and workspace refinement
### Work
- Search titles and metadata, then authorized content search.
- Templates, nested pages, favorites, recent documents.
- Workspace invitations and roles.
- Improve responsive and accessible UI.
### Exit criteria
- Search never reveals unauthorized document metadata or content.
- Key workflows work at supported viewport sizes.
- Keyboard and accessibility checks are completed.

## Phase 9 — AI document summarization
### Work
- Define AI provider abstraction, privacy disclosure, and cost controls.
- Add explicit Summarize action.
- Support short, medium, and detailed summary lengths.
- Include key points and optional action items.
- Cache by document revision if appropriate.
- Add retry, timeout, rate-limit, and provider-error handling.
### Exit criteria
- Only authorized users can request/read summaries.
- Summary requests do not modify source content.
- Stale summaries are not shown as current.
- Tests cover provider failures, limits, and permission changes.
- AI cost and data-retention behavior are documented.

## Phase 10 — Production hardening and launch
### Work
- Security review, dependency review, backups, restore drill.
- Logging, monitoring, error reporting, and performance baselines.
- Load/concurrency testing and deployment checklist.
- Accessibility, responsive, and browser testing.
- User-facing help and privacy information.
### Exit criteria
- Critical/high-priority defects are resolved or explicitly accepted.
- Backup restoration is verified.
- Deployment and rollback procedures are documented.
- Release acceptance checklist is signed off.

## Cross-phase requirements
- Update `projectStatus.md` after each meaningful milestone.
- Add tests alongside implementation, not at the end.
- Keep `projectTest.md` synchronized with actual test coverage.
- Review security and permission impact for every feature.
- Do not mark a feature complete until its acceptance criteria and tests pass.

## Priority guide
- P0: blocks safe core use or data integrity.
- P1: needed for a useful first release.
- P2: valuable post-MVP enhancement.
- P3: future/optional expansion.
