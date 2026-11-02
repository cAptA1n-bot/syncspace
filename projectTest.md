# SyncSpace — Test Plan and Test Case Catalogue

## 1. Purpose
This document defines the planned test coverage for SyncSpace. Cases should be converted into automated unit, integration, API, collaboration, and end-to-end tests where practical. Not every feature exists yet; mark cases as **Not Run** until implemented and tested.

## 2. Status convention
- **Not Run:** Test has not been executed.
- **Pass:** Actual result matches expected result.
- **Fail:** Actual result differs from expected result.
- **Blocked:** Cannot run because a dependency or feature is unavailable.
- **N/A:** Not applicable to the current release.

Each test should record the test run, build/commit, environment, actual result, and defect ID when it fails.

## 3. Test environments and general assumptions
- Use a dedicated test database and test storage bucket.
- Use synthetic test users and documents; never use production user data.
- Keep credentials in environment variables or a test secret manager.
- Test both authorized and unauthorized actors.
- Include desktop and mobile viewport checks for user-facing flows.
- For collaboration tests, use at least two independent clients and preferably multiple tabs/browsers.
- For AI tests, use a mocked provider for deterministic automated tests and a controlled opt-in integration test for the real provider.
- Default execution status for all cases below: **Not Run**.

## 4. Test data fixtures
Create reusable fixtures:
- User A: workspace owner and document owner.
- User B: workspace member/editor.
- User C: viewer.
- User D: authenticated user with no access.
- User E: unauthenticated client.
- Workspace A and Workspace B with separate memberships.
- Document A: normal rich-text document.
- Document B: document with headings, lists, links, image, and code block.
- Document C: large document.
- Document D: deleted/trash document.
- Document E: document containing strings resembling HTML/script injection.
- File fixtures: valid image, valid PDF, unsupported extension, oversized file, spoofed MIME type, empty file.
- AI fixture outputs: valid short/medium/detailed summary, malformed response, timeout, rate limit, provider error.

---

## 5. Authentication and account tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| AUTH-T001 | P0 | Register with valid data | Submit valid name, email, and strong password | Account is created; response contains no password/hash |
| AUTH-T002 | P1 | Reject malformed email | Register with invalid email | Validation error; no account created |
| AUTH-T003 | P1 | Reject weak password | Register with password below configured policy | Validation error; no account created |
| AUTH-T004 | P1 | Reject missing required fields | Omit each required field in turn | Clear validation error |
| AUTH-T005 | P1 | Normalize email consistently | Register with mixed-case email then try same normalized email | Duplicate account is rejected |
| AUTH-T006 | P0 | Prevent duplicate accounts | Register same email twice | Second request fails safely |
| AUTH-T007 | P0 | Password is hashed | Inspect stored test record | Plaintext password is never stored |
| AUTH-T008 | P0 | Login with valid credentials | Submit correct email/password | Auth succeeds and safe user data is returned |
| AUTH-T009 | P0 | Reject incorrect password | Submit wrong password | Generic authentication failure; no session created |
| AUTH-T010 | P1 | Reject unknown account login | Submit unknown email | Generic failure that avoids unnecessary account enumeration |
| AUTH-T011 | P0 | Logout invalidates authentication | Login, logout, then call protected endpoint | Protected endpoint rejects invalidated session/token as designed |
| AUTH-T012 | P0 | Protected endpoint rejects no credentials | Call protected endpoint without cookie/token | 401/appropriate unauthenticated response |
| AUTH-T013 | P0 | Reject malformed/expired token | Send malformed or expired token | Request rejected safely |
| AUTH-T014 | P1 | Cookie security attributes | Inspect auth cookie in production-like configuration | HttpOnly, Secure where applicable, and appropriate SameSite attributes |
| AUTH-T015 | P1 | CORS allows configured origin only | Send credentialed request from allowed and disallowed origins | Only configured origin is permitted |
| AUTH-T016 | P1 | Profile update validation | Submit valid and invalid profile values | Valid changes persist; invalid changes are rejected |
| AUTH-T017 | P1 | Password change requires current authorization | Change password with valid/invalid current credentials as designed | Only authorized request succeeds; existing sessions follow policy |
| AUTH-T018 | P2 | Password reset token expiry | Use expired reset token | Reset rejected |
| AUTH-T019 | P2 | Password reset token single-use | Reuse a consumed reset token | Second use rejected |
| AUTH-T020 | P1 | Rate-limit authentication abuse | Send requests beyond configured limit | Requests are throttled without exposing secrets |
| AUTH-T021 | P1 | Account deletion policy | Request account deletion with confirmation | Deletion/retention workflow follows documented policy |
| AUTH-T022 | P1 | No sensitive data in errors/logs | Trigger auth failures | Passwords, tokens, and secrets are not logged or returned |

## 6. Workspace and membership tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| WS-T001 | P1 | Create personal workspace | Register user and initialize workspace | Personal workspace is created according to product rules |
| WS-T002 | P1 | Create team workspace | Owner creates workspace with valid name | Workspace exists and creator has owner role |
| WS-T003 | P1 | Reject invalid workspace name | Submit blank/overlong/invalid name | Validation error |
| WS-T004 | P1 | List only accessible workspaces | User requests workspace list | Only workspaces the user may access are returned |
| WS-T005 | P0 | Prevent cross-workspace access | User A requests Workspace B without membership/access | Request is denied |
| WS-T006 | P1 | Invite valid member | Owner/admin invites User B | Invitation is created and delivered/visible as designed |
| WS-T007 | P1 | Reject unauthorized invitation | Regular member attempts invitation without permission | Request is denied |
| WS-T008 | P1 | Accept valid invitation | Invitee accepts an unexpired invitation | Membership is created with intended role |
| WS-T009 | P1 | Reject expired/revoked invitation | Accept expired or revoked invite | Request is denied |
| WS-T010 | P1 | Prevent invitation replay | Accept the same one-time invite twice | Second acceptance is rejected or idempotently handled |
| WS-T011 | P1 | Change member role | Authorized owner/admin changes role | Role updates and effective permissions change |
| WS-T012 | P0 | Prevent unauthorized role escalation | Member attempts to promote self or another user | Request is denied |
| WS-T013 | P1 | Remove member | Authorized admin removes User B | Membership ends and access is revoked |
| WS-T014 | P0 | Revocation affects active collaboration | Remove User B while connected to a document | User B loses future API and collaboration access |
| WS-T015 | P1 | Member leaves workspace | Member leaves an eligible workspace | Membership is removed without corrupting workspace data |
| WS-T016 | P1 | Owner cannot accidentally orphan workspace | Attempt to remove/delete sole owner | Operation is rejected or ownership transfer is required |
| WS-T017 | P2 | Transfer ownership | Current owner transfers to eligible member | New owner has ownership; audit trail is retained |
| WS-T018 | P1 | Workspace deletion confirmation | Owner attempts deletion | Only authorized owner can delete; defined retention rules apply |

## 7. Document and folder management tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| DOC-T001 | P0 | Create document | Authorized user creates document with valid title | Document is created with owner, timestamps, and valid initial content |
| DOC-T002 | P1 | Reject invalid document title | Submit empty/overlong title | Validation error |
| DOC-T003 | P0 | List user's documents | Request document list | Only accessible documents are returned |
| DOC-T004 | P0 | Read authorized document | Open Document A as owner/editor/viewer | Content is returned according to access policy |
| DOC-T005 | P0 | Deny inaccessible document read | User D requests Document A | Access denied without leaking content |
| DOC-T006 | P1 | Rename document | Rename with valid title | New title persists and appears in lists |
| DOC-T007 | P1 | Update document content | Save valid editor content | Content persists and updated timestamp changes |
| DOC-T008 | P0 | Reject unauthorized content update | Viewer or User D attempts update | Request denied; stored content unchanged |
| DOC-T009 | P1 | Delete document | Owner deletes Document A | Document enters trash or defined deletion state |
| DOC-T010 | P1 | Restore deleted document | Owner restores trashed document | Document is accessible again with content intact |
| DOC-T011 | P1 | Permanently delete according to policy | Authorized user permanently deletes eligible item | Content and related storage are handled according to retention policy |
| DOC-T012 | P1 | Create folder | Create folder with valid name | Folder appears in correct parent |
| DOC-T013 | P1 | Move document between folders | Move to an authorized destination | Parent relation changes; document remains intact |
| DOC-T014 | P1 | Prevent folder cycles | Move a folder into itself or descendant | Operation rejected |
| DOC-T015 | P1 | Duplicate document | Duplicate a document | New ID and ownership/permissions follow documented copy policy |
| DOC-T016 | P1 | Favorite/unfavorite document | Toggle favorite | State persists per intended user scope |
| DOC-T017 | P1 | Recent documents | Open several documents | Recent list updates and is user-specific |
| DOC-T018 | P1 | Handle concurrent metadata edits | Two clients rename/move same document | Defined conflict policy applies; no silent corruption |
| DOC-T019 | P1 | Sanitize unsafe rich content | Save and render script/event-handler payload | Unsafe payload does not execute |
| DOC-T020 | P1 | Enforce document size limits | Submit oversized content | Request is rejected or safely handled within configured limits |
| DOC-T021 | P1 | Handle missing document | Request nonexistent ID | Safe 404 response; no server crash |
| DOC-T022 | P1 | Validate IDs and query parameters | Send malformed identifiers and invalid pagination | Safe validation errors |
| DOC-T023 | P1 | Preserve content after reload | Save document, reload page, reopen | Latest confirmed content is present |
| DOC-T024 | P1 | Prevent cross-user document enumeration | Probe IDs belonging to other users | No content or sensitive metadata leakage |

## 8. Rich-text editor tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| EDIT-T001 | P1 | Enter and persist paragraphs | Type multiple paragraphs and save | Paragraph structure persists |
| EDIT-T002 | P1 | Format text | Apply bold, italic, underline, and strikethrough | Formatting renders and persists |
| EDIT-T003 | P1 | Create headings | Add supported heading levels | Headings persist and appear in outline if implemented |
| EDIT-T004 | P1 | Create lists | Add ordered and unordered lists | List structure and ordering persist |
| EDIT-T005 | P1 | Insert links | Add valid link and reopen document | Link persists and follows safe URL policy |
| EDIT-T006 | P0 | Reject dangerous links | Insert `javascript:` or unsafe URL scheme | Link is rejected or rendered inert |
| EDIT-T007 | P1 | Undo and redo | Edit content, undo, then redo | Editor state changes correctly |
| EDIT-T008 | P1 | Copy/paste content | Paste text and supported formatted content | Content is normalized safely |
| EDIT-T009 | P1 | Insert image block | Insert an authorized uploaded image | Image displays and persists |
| EDIT-T010 | P2 | Tables | Create/edit a table if supported | Structure persists and remains editable |
| EDIT-T011 | P2 | Code block | Add code block with sample text | Code is preserved and rendered safely |
| EDIT-T012 | P2 | Slash commands | Invoke slash menu and choose a block | Correct block is inserted |
| EDIT-T013 | P1 | Keyboard navigation | Navigate editor and toolbar without mouse | Controls are reachable and operable |
| EDIT-T014 | P1 | Accessible editor controls | Inspect labels, focus, and keyboard semantics | Controls have accessible names and visible focus |
| EDIT-T015 | P1 | Handle empty document | Open a new document | Empty state is usable and no crash occurs |
| EDIT-T016 | P1 | Handle malformed persisted content | Load invalid/unrecognized content schema | Safe fallback/error; no crash or script execution |
| EDIT-T017 | P1 | Autosave status | Type, wait for save confirmation | UI transitions accurately through saving/saved |
| EDIT-T018 | P0 | Save failure visibility | Simulate backend/network save failure | Error is visible; unsaved content is not falsely marked saved |
| EDIT-T019 | P1 | Recover unsaved edits where supported | Trigger temporary network failure and reconnect | Pending edits are retried/recovered according to design |
| EDIT-T020 | P1 | Responsive editor layout | Test desktop/tablet/mobile widths | Editor remains usable within supported breakpoints |

## 9. Real-time collaboration tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| RTC-T001 | P0 | Two users open same document | User A and User B open Document A | Both clients establish authorized shared state |
| RTC-T002 | P0 | Propagate text insertion | A types text | B sees the change within the agreed latency target |
| RTC-T003 | P0 | Concurrent insertions | A and B type at the same position simultaneously | Both changes converge without silent loss |
| RTC-T004 | P0 | Concurrent edits in different locations | A and B edit separate sections | Both changes persist |
| RTC-T005 | P0 | Concurrent delete and insert | One client deletes while another inserts nearby | Shared state converges according to collaboration algorithm |
| RTC-T006 | P1 | Live presence | A and B enter document | Presence list reflects connected collaborators |
| RTC-T007 | P2 | Cursor and selection updates | Users move cursors/select text | Other authorized clients see accurate presence indicators |
| RTC-T008 | P0 | Unauthorized room join | User D attempts to join document room | Join is denied |
| RTC-T009 | P0 | Forged document identifier | Client changes room/document ID in event | Server denies unauthorized access |
| RTC-T010 | P0 | Revoke access during session | Remove User B while connected | B is disconnected or prevented from further reads/writes promptly |
| RTC-T011 | P1 | Network disconnect/reconnect | Disconnect client, edit/reconnect as supported | State resynchronizes without losing confirmed edits |
| RTC-T012 | P1 | Server restart recovery | Save edits, restart server, reconnect clients | Durable state is restored |
| RTC-T013 | P1 | Duplicate event handling | Replay duplicate synchronization/application event | No duplicate content corruption or repeated side effect |
| RTC-T014 | P1 | Out-of-order event handling | Delay/reorder supported application events | State remains consistent or invalid event is safely handled |
| RTC-T015 | P1 | Multiple tabs for same user | Open same document in two tabs and edit | Tabs converge and do not corrupt persisted state |
| RTC-T016 | P1 | Presence cleanup | Close browser abruptly or lose connection | Stale presence expires within configured timeout |
| RTC-T017 | P1 | Persistence after simultaneous edits | Concurrently edit then reload both clients | All confirmed changes remain |
| RTC-T018 | P1 | Large document synchronization | Load and edit a large supported document | Synchronization completes within agreed performance target |
| RTC-T019 | P1 | Burst typing | Simulate rapid edits from multiple clients | Server remains stable; updates converge |
| RTC-T020 | P1 | Expired authentication on socket | Expire/revoke credentials and attempt event | Unauthorized event is rejected |
| RTC-T021 | P1 | Collaboration error recovery | Force provider/persistence error | User sees a recoverable error; server does not falsely confirm durability |
| RTC-T022 | P1 | Horizontal scaling, if enabled | Connect clients to multiple instances | Shared collaboration state and presence work as designed |
| RTC-T023 | P1 | Presence does not leak private data | Inspect presence payload as another authorized member | Only intended display fields are exposed |
| RTC-T024 | P0 | Document isolation | Two clients in different documents send events | Changes never cross document boundaries |

## 10. Sharing and authorization tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| SHARE-T001 | P0 | Owner shares with user | Owner grants User C viewer access | User C can read but not edit |
| SHARE-T002 | P0 | Editor shares if permitted | Editor attempts to share under configured policy | Action succeeds only when policy allows it |
| SHARE-T003 | P0 | Viewer cannot edit | Viewer sends content update directly to API | Server rejects update |
| SHARE-T004 | P1 | Commenter cannot edit content | Commenter submits document edit | Server rejects edit |
| SHARE-T005 | P0 | Editor can edit | Editor updates content | Update succeeds |
| SHARE-T006 | P0 | Non-owner cannot change owner settings | Editor attempts owner-only operation | Request denied |
| SHARE-T007 | P0 | Revoke direct share | Owner revokes User C | User C loses access |
| SHARE-T008 | P0 | Share link viewer scope | Open viewer link in a fresh session | Only allowed document content is readable |
| SHARE-T009 | P0 | Disabled link rejected | Disable share link and reuse it | Access denied |
| SHARE-T010 | P1 | Link expiration | Use expired share link | Access denied |
| SHARE-T011 | P1 | Invalid share token | Guess or alter token | Access denied without revealing document data |
| SHARE-T012 | P1 | Prevent private document discovery | Search/list as unrelated user | Private document is not exposed |
| SHARE-T013 | P1 | Permission inheritance | Move content into/out of a folder with policy | Effective access follows documented rules and is tested |
| SHARE-T014 | P1 | Download restriction | Attempt download where policy disables it | Download is denied when restriction is enforceable |
| SHARE-T015 | P0 | Authorization on every endpoint | Test list, read, update, delete, export, and file endpoints | Each endpoint enforces its own access checks |
| SHARE-T016 | P0 | Authorization on realtime events | Attempt write via socket without edit permission | Server/provider rejects change |
| SHARE-T017 | P1 | Share with nonexistent user | Enter unknown email/user | Safe, clear result consistent with privacy policy |
| SHARE-T018 | P1 | Sharing audit event | Create/revoke share | Audit record exists if audit logging is implemented |

## 11. File upload and attachment tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| FILE-T001 | P1 | Upload valid image | Upload supported image under size limit | File metadata is stored and upload succeeds |
| FILE-T002 | P1 | Upload valid PDF | Upload PDF if supported | Upload succeeds and metadata is correct |
| FILE-T003 | P0 | Reject unsupported file type | Upload disallowed extension/type | Upload is rejected |
| FILE-T004 | P0 | Reject oversized file | Upload file above configured limit | Request rejected with clear error |
| FILE-T005 | P0 | Detect MIME spoofing | Send executable content with image MIME type | Content validation rejects or quarantines it |
| FILE-T006 | P1 | Reject empty/invalid file | Upload empty or corrupt file | Safe rejection or explicitly supported handling |
| FILE-T007 | P0 | Unauthorized upload | User without edit permission uploads to document | Request denied |
| FILE-T008 | P0 | Unauthorized download | User without access requests file object | Request denied |
| FILE-T009 | P1 | File metadata correctness | Upload then inspect metadata | Owner, size, type, storage key, and timestamps are correct |
| FILE-T010 | P1 | Private object storage | Inspect public access configuration | Private files are not publicly accessible by default |
| FILE-T011 | P1 | Signed URL expiry, if used | Use expired signed URL | Access fails after expiry |
| FILE-T012 | P1 | File deletion cleanup | Delete attachment/document per policy | Storage cleanup is safe and retryable |
| FILE-T013 | P1 | Filename safety | Upload filename with path traversal/special characters | Stored name/key is safely generated; no path traversal |
| FILE-T014 | P1 | Download content headers | Download supported file | Safe content type and disposition headers are used |
| FILE-T015 | P1 | Image rendering safety | Render uploaded image | Image loads only through authorized storage path |
| FILE-T016 | P2 | Preview supported files | Open supported preview | Preview works without leaking unauthorized files |

## 12. Version history and recovery tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| VER-T001 | P1 | Create revision checkpoint | Make meaningful edits and trigger checkpoint | Revision is recorded according to policy |
| VER-T002 | P1 | Revision metadata | Inspect revision | Author, timestamp, and revision identifier are correct where available |
| VER-T003 | P1 | List revision history | Authorized user requests history | Only permitted history is shown |
| VER-T004 | P0 | Unauthorized revision access | User D requests revision history | Access denied |
| VER-T005 | P1 | Restore previous revision | Restore an earlier revision | Content returns to that state and current state is safely checkpointed |
| VER-T006 | P1 | Restore while collaborator is active | Restore while another client has document open | All clients converge to restored state; no silent overwrite |
| VER-T007 | P1 | Invalid revision ID | Request nonexistent/malformed revision | Safe error response |
| VER-T008 | P1 | Revision retention policy | Exceed configured retention | Pruning follows policy and preserves required revisions |
| VER-T009 | P1 | Deleted document recovery | Restore from trash | Content, metadata, and permitted attachments are recovered |
| VER-T010 | P1 | Recovery after server restart | Restart and load saved document/revisions | Durable revisions remain available |

## 13. Comments, mentions, and notifications tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| COM-T001 | P2 | Add comment | Authorized commenter adds comment | Comment is stored and displayed |
| COM-T002 | P2 | Reply to comment | User replies to thread | Reply appears in correct thread |
| COM-T003 | P2 | Resolve/reopen thread | Authorized user resolves and reopens | Thread state updates and persists |
| COM-T004 | P0 | Unauthorized comment access | User D reads/adds comment on private document | Access denied |
| COM-T005 | P2 | Anchor comment to text | Select text and add comment | Anchor behaves according to editor design |
| COM-T006 | P2 | Mention valid collaborator | Mention authorized workspace/document user | Mention is parsed and notification follows policy |
| COM-T007 | P1 | Mention inaccessible user | Attempt mention that would leak private content | System follows privacy policy and does not grant access |
| COM-T008 | P2 | Mark notification read | Mark notification as read | State persists for intended user |
| COM-T009 | P2 | Notification preference | Disable a notification category | Disabled category is not delivered through that channel |
| COM-T010 | P1 | Notification provider failure | Simulate email/in-app notification failure | Main document/comment action remains successful; failure is retryable/logged |
| COM-T011 | P2 | Duplicate notification prevention | Retry event delivery | Duplicate side effects are prevented or handled idempotently |
| COM-T012 | P2 | Notification isolation | User A checks notifications | User B's private notifications are not returned |

## 14. Search and navigation tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| SEARCH-T001 | P1 | Search by title | Search a known document title | Relevant accessible document appears |
| SEARCH-T002 | P2 | Search by content | Search a phrase in a document | Accessible matching document appears if content search is implemented |
| SEARCH-T003 | P1 | Search excludes private documents | Search as User D | Inaccessible document does not appear |
| SEARCH-T004 | P2 | Filter by workspace | Apply workspace filter | Results belong to selected accessible workspace |
| SEARCH-T005 | P2 | Filter by owner | Apply owner filter | Results match selected owner within accessible scope |
| SEARCH-T006 | P1 | Empty query | Submit empty search | Defined empty-state behavior; no unnecessary broad data leak |
| SEARCH-T007 | P1 | Special-character query | Search punctuation, Unicode, and query operators | Safe, predictable result without query injection |
| SEARCH-T008 | P1 | Pagination | Navigate result pages | No unintended duplicates/omissions under stable data |
| SEARCH-T009 | P2 | Favorites and recent | Open/favorite documents | Lists update and remain user-specific |
| SEARCH-T010 | P2 | Deleted documents excluded | Search after deleting document | Trash behavior follows product policy |

## 15. AI document summarization tests

These cases apply when the AI summarization feature is implemented. Use mocked provider responses for routine automated tests.

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| AI-T001 | P1 | Summarize authorized document | Authorized user requests short summary | Summary is returned in expected structure |
| AI-T002 | P1 | Medium summary | Request medium length | Output follows medium-length guidance |
| AI-T003 | P1 | Detailed summary | Request detailed length | Output is more comprehensive than short summary |
| AI-T004 | P1 | Extract key points | Summarize document with clear sections | Key points reflect source content |
| AI-T005 | P2 | Extract action items | Summarize notes containing tasks and owners | Action items are extracted when supported by source |
| AI-T006 | P0 | Reject unauthorized summary request | User D requests summary of private document | Request is denied before source content is sent to provider |
| AI-T007 | P0 | Reject unauthorized cached summary read | User D attempts to retrieve cached summary | Request is denied |
| AI-T008 | P1 | Original document unchanged | Generate summary and compare source revision/content | Source document remains unchanged |
| AI-T009 | P1 | Copy summary | Copy generated summary through UI | Copied text matches displayed summary |
| AI-T010 | P2 | Insert summary only on explicit action | User chooses insert action | Summary is inserted only after explicit confirmation |
| AI-T011 | P1 | Cache summary by revision | Request summary twice for same revision and options | Cache policy avoids unnecessary provider call where appropriate |
| AI-T012 | P1 | Invalidate stale summary | Edit document after summary generation | Old summary is not presented as current without a stale label |
| AI-T013 | P1 | Different length cache keys | Request short then detailed summary | Wrong-length cached result is not returned |
| AI-T014 | P1 | Empty document | Request summary of empty document | Helpful empty-content response; no unnecessary provider call |
| AI-T015 | P1 | Very large document | Request summary beyond model context limit | Safe chunking/limit/error behavior; no server crash |
| AI-T016 | P1 | Provider timeout | Mock provider timeout | User sees recoverable error; request times out safely |
| AI-T017 | P1 | Provider rate limit | Mock 429/rate-limit response | Retry/backoff policy applies; no runaway retry loop |
| AI-T018 | P1 | Provider server error | Mock provider 5xx response | Safe error and retry behavior |
| AI-T019 | P1 | Malformed provider response | Return invalid JSON/empty output | Output is validated; safe failure/fallback |
| AI-T020 | P1 | AI service unavailable | Disable provider credentials/service | Core document editing still works |
| AI-T021 | P1 | Prompt injection inside document | Include text instructing AI to reveal secrets or ignore task | Content is treated as untrusted input; system instructions/secrets are not exposed |
| AI-T022 | P1 | No fabricated certainty | Summarize document with missing/ambiguous facts | Summary avoids presenting unsupported facts as source content |
| AI-T023 | P1 | Unicode and multilingual content | Summarize Unicode or supported non-English document | Output handles supported language/text without corruption |
| AI-T024 | P1 | AI cost/rate controls | Exceed configured per-user limits | Request is throttled with clear response |
| AI-T025 | P0 | Provider key secrecy | Trigger provider errors and inspect logs/responses | API key is never exposed |
| AI-T026 | P1 | Privacy/data disclosure | Request summary under configured privacy policy | Only authorized content is sent; disclosure/consent rules are followed |
| AI-T027 | P1 | Concurrent edit during summary | Edit document while summary request runs | Summary is tied to the source revision used; stale result is labeled or invalidated |
| AI-T028 | P1 | Summary deletion/retention | Delete source document or revoke access | Cached summary follows deletion, access, and retention policy |
| AI-T029 | P1 | Prompt/input size validation | Send huge or malformed summary request | Request is bounded and safely rejected/processed |
| AI-T030 | P2 | Summary quality review | Compare generated summary with source using a human rubric | Summary preserves central facts, caveats, and intent; no critical omissions |

## 16. Security and privacy tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| SEC-T001 | P0 | Object-level authorization | Change resource IDs in API requests | User cannot access another user's resource |
| SEC-T002 | P0 | Broken function-level authorization | Call admin/owner endpoints as member | Request denied |
| SEC-T003 | P0 | NoSQL injection resistance | Send operator-shaped input to query fields | Input is validated/treated safely; unauthorized data is not returned |
| SEC-T004 | P0 | XSS resistance | Store and render HTML/script payloads | Payload does not execute |
| SEC-T005 | P1 | CSRF protection strategy | Test cookie-authenticated state-changing requests from untrusted origin | CSRF controls and SameSite policy prevent unauthorized state changes |
| SEC-T006 | P1 | Rate limiting | Exceed limits on login, upload, sharing, and AI endpoints | Requests are throttled |
| SEC-T007 | P1 | Secure HTTP headers | Inspect response headers | Appropriate security headers are set |
| SEC-T008 | P0 | Secret leakage | Inspect client bundle, API responses, logs, and repository | No server secrets are exposed |
| SEC-T009 | P1 | Error detail minimization | Trigger unexpected server error | Client receives safe error; internal stack/secret details are not exposed |
| SEC-T010 | P1 | Dependency audit | Run configured dependency/security checks | Findings are reviewed and critical issues addressed |
| SEC-T011 | P1 | Data export authorization | Request export for inaccessible account/workspace | Request denied |
| SEC-T012 | P1 | Account deletion propagation | Delete account under documented policy | Data, memberships, files, and AI cache follow retention/deletion policy |
| SEC-T013 | P0 | Tenant isolation | Attempt cross-workspace API, search, file, and socket access | No cross-tenant data leakage |
| SEC-T014 | P1 | Logging privacy | Inspect logs during document edits and AI requests | Logs avoid full private content unless explicitly justified and protected |
| SEC-T015 | P1 | Transport security | Test production endpoints | HTTPS is enforced for sensitive traffic |

## 17. Reliability, performance, and deployment tests

| ID | Priority | Test case | Steps / input | Expected result |
|---|---|---|---|---|
| OPS-T001 | P1 | Health check | Call health endpoint | Reports service readiness without leaking secrets |
| OPS-T002 | P1 | Database unavailable | Stop test database and call API | Graceful failure; no false success |
| OPS-T003 | P1 | Database reconnect | Restore database after outage | Service recovers according to retry policy |
| OPS-T004 | P0 | Durable save acknowledgement | Interrupt persistence during edit | UI/server does not claim durable save incorrectly |
| OPS-T005 | P1 | Backup creation | Run configured backup process | Backup completes and is recorded |
| OPS-T006 | P0 | Backup restoration drill | Restore backup into isolated environment | Required data can be recovered and verified |
| OPS-T007 | P1 | Graceful shutdown | Stop server during normal traffic | Connections close safely and persisted data remains consistent |
| OPS-T008 | P1 | Unexpected process restart | Restart application after edits | Durable content recovers |
| OPS-T009 | P1 | Concurrent user load | Simulate agreed baseline user load | Error rate and latency remain within established targets |
| OPS-T010 | P1 | Collaboration load | Simulate multiple concurrent editors | No cross-document leakage or data loss |
| OPS-T011 | P2 | Large document performance | Open/edit supported large document | Performance meets target established by baseline |
| OPS-T012 | P1 | Memory/resource stability | Run sustained collaboration test | No unbounded memory/resource growth |
| OPS-T013 | P1 | Frontend production build | Run production build | Build completes without errors |
| OPS-T014 | P1 | Deployment configuration | Deploy to staging with production-like config | App starts and required dependencies are healthy |
| OPS-T015 | P1 | Migration compatibility | Apply schema/data migration to representative data | Data remains valid and rollback strategy is understood |
| OPS-T016 | P1 | Rollback procedure | Deploy then roll back a test release | Service returns to known-good release without unexpected data loss |
| OPS-T017 | P1 | Monitoring and alerting | Simulate configured failure conditions | Alerts/logs provide actionable signal without secret leakage |
| OPS-T018 | P1 | Browser compatibility | Test supported browsers | Core workflows function in declared browser support matrix |

## 18. End-to-end acceptance journeys

| ID | Priority | Journey | Steps | Expected result |
|---|---|---|---|---|
| E2E-T001 | P0 | New user creates first document | Register, log in, create document, type content, wait for save, reload | Document is available with content intact |
| E2E-T002 | P0 | Two users collaborate | User A creates/shares document; User B opens; both edit concurrently | Changes converge and persist for both |
| E2E-T003 | P0 | Viewer cannot edit | Owner shares as viewer; viewer attempts UI and direct API edit | UI prevents action and server rejects direct request |
| E2E-T004 | P1 | Revoke shared access | Share document, open as recipient, revoke access, recipient retries | Recipient loses access |
| E2E-T005 | P1 | Delete and restore document | Create, edit, delete, restore, reopen | Content and permitted metadata are recovered |
| E2E-T006 | P1 | Upload and access attachment | Upload valid image, attach, reopen, download | Attachment is accessible only to authorized users |
| E2E-T007 | P2 | Comment and notify | Add comment, reply, mention user | Thread persists and intended notification is delivered |
| E2E-T008 | P2 | Restore previous revision | Make revisions, restore earlier version | Document matches restored revision and current state remains durable |
| E2E-T009 | P1 | Search authorized content | Create several docs, search as different users | Results are relevant and permission-filtered |
| E2E-T010 | P1 | AI summarize document | Authorized user requests summary and copies it | Summary appears, source document is unchanged, access is enforced |
| E2E-T011 | P1 | AI provider outage | Simulate provider failure while document is open | Summary shows recoverable failure; editing remains usable |
| E2E-T012 | P0 | Tenant isolation journey | User A creates private document; User D tries API, search, file URL, and socket access | All unauthorized paths are denied |

## 19. Regression checklist for every release
- [ ] Registration/login/logout still work.
- [ ] Protected APIs enforce authentication.
- [ ] User and workspace data remain isolated.
- [ ] Document create/read/update/delete works.
- [ ] Confirmed edits persist after reload and server restart.
- [ ] Real-time concurrent edits converge.
- [ ] Unauthorized users cannot join document sessions.
- [ ] Sharing and revocation work for APIs and active collaboration.
- [ ] File upload/download authorization and validation work.
- [ ] Trash and restore preserve data according to policy.
- [ ] Search respects permissions.
- [ ] Comments/notifications do not leak private content.
- [ ] AI summary access, caching, source immutability, and provider failure paths work when AI is enabled.
- [ ] Production build and configured automated test suite pass.
- [ ] No secrets appear in repository, client bundle, responses, or logs.

## 20. Test automation recommendations
Adapt to the existing stack:
- Unit tests: validators, permission helpers, services, summary formatting/cache-key logic.
- API integration tests: authentication, document CRUD, sharing, file authorization.
- Collaboration tests: at least two independent Yjs clients against the actual provider/persistence setup.
- Frontend component tests: editor controls, loading/error states, sharing dialog, summary UI.
- E2E tests: Playwright or equivalent for core user journeys.
- Security checks: dependency audit and targeted authorization tests in CI.
- Load tests: select a tool after defining concurrency and latency targets.

## 21. Exit criteria for release
A release should not be marked ready until:
- All P0 tests pass.
- P1 tests relevant to included features pass, or exceptions are explicitly approved.
- No unresolved critical security/data-integrity issue remains.
- Backup restoration is verified for production releases.
- Known limitations and unsupported cases are documented.
- The actual test results and build/commit are recorded in the release notes.
