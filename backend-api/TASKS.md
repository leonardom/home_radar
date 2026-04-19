# Backend API Task Tracker

Status legend:

- [ ] Pending
- [x] Completed

## Task 1 - Registration Foundation (FR-1)

Goal: Implement user registration with email/password, unique email validation, and secure password storage.

### Subtasks

- [x] Define user domain model (id, email, passwordHash, createdAt, updatedAt, status).
- [x] Add database schema/migration for users table.
- [x] Add unique database constraint/index for email.
- [x] Create user repository methods: findByEmail, createUser, findById.
- [x] Add request validation for registration payload (email/password rules).
- [x] Implement password hashing (argon2 or bcrypt).
- [x] Implement POST /auth/register endpoint.
- [x] Return safe response without passwordHash.
- [x] Handle duplicate email and validation errors.
- [x] Add unit tests for hashing and validation.
- [x] Add integration tests for registration success/failure cases.

## Task 2 - Authentication and Token Lifecycle (FR-2)

Goal: Authenticate users and provide secure token issuance, expiration, and renewal.

### Subtasks

- [x] Implement POST /auth/login endpoint.
- [x] Verify credentials with secure password comparison.
- [x] Configure JWT access token issuance with short expiration.
- [x] Design refresh token model and persistence strategy.
- [x] Implement POST /auth/refresh endpoint.
- [x] Implement POST /auth/logout endpoint (token revoke).
- [x] Add token claims contract (sub, email, iat, exp, jti).
- [x] Add auth middleware/guard for protected routes.
- [x] Implement refresh token expiration and rotation policy.
- [x] Add unit tests for token generation/verification.
- [x] Add integration tests for login, refresh, expiration, and revoke scenarios.

## Task 3 - User Profile Management (FR-3)

Goal: Allow authenticated users to retrieve, update, and delete their profile.

### Subtasks

- [x] Implement GET /users/me endpoint.
- [x] Implement PATCH /users/me endpoint.
- [x] Define and validate editable fields for profile updates.
- [x] Implement DELETE /users/me endpoint.
- [x] Revoke all user refresh tokens when account is deleted.
- [x] Decide and implement deletion strategy (soft delete or hard delete).
- [x] Enforce authorization so users can only access their own profile.
- [x] Standardize profile route response and error contracts.
- [x] Add unit tests for update and delete logic.
- [x] Add integration tests for retrieve/update/delete profile flows.

Deletion strategy selected: soft delete (`status=deleted`, `deletedAt` timestamp).

## Task 4 - Search Filters (FR-7, FR-8, FR-9)

Goal: Allow users to create and manage property search filters with strong validation and business constraints.

### Subtasks

- [x] Define search filter domain model (id, userId, priceMin, priceMax, bedroomsMin, bathroomsMin, location, propertyType, keywords, createdAt, updatedAt).
- [x] Add database schema/migration for filters table.
- [x] Add user ownership relation (`filters.user_id -> users.id`) and index common query fields.
- [x] Implement repository methods: createFilter, listFiltersByUser, updateFilterById, deleteFilterById, countFiltersByUser.
- [x] Define validation schemas for filter create/update payloads.
- [x] Implement FR-9 numeric constraints (valid price and room ranges, min <= max when applicable).
- [x] Implement POST /filters endpoint (FR-7).
- [x] Implement GET /filters endpoint (FR-8 view all filters).
- [x] Implement PATCH /filters/:id endpoint (FR-8 update filter).
- [x] Implement DELETE /filters/:id endpoint (FR-8 delete filter).
- [x] Enforce authorization so users only access their own filters.
- [x] Enforce at least one-filter-per-user rule (free-tier optional toggle/flag).
- [x] Standardize response and error contracts for all filter endpoints.
- [x] Add unit tests for filter validation, range constraints, and service logic.
- [x] Add integration tests for create/list/update/delete filter flows and ownership checks.

## Task 5 - Property Matching Engine (FR-10)

Goal: Match properties against user-defined filters using price, minimum bedrooms, location, and optional keywords.

### Subtasks

- [x] Define matching domain model and output contract (propertyId, filterId, userId, matchReason, matchedAt).
- [x] Add repository query to fetch active filters eligible for matching.
- [x] Implement price range matching logic (`price >= min` and `price <= max` when limits exist).
- [x] Implement minimum bedrooms matching logic (`property.bedrooms >= filter.bedroomsMin` when set).
- [x] Implement location matching strategy (exact or normalized contains) and document rule.
- [x] Implement optional keyword matching strategy for MVP (skip if filter keywords empty).
- [x] Build pure matching service function that evaluates one property against one filter.
- [x] Build batch matching flow to evaluate one property against all candidate filters.
- [x] Standardize match result payload for downstream storage/trigger layers.
- [x] Add unit tests for each matching criterion and combined scenarios.

## Task 6 - Match Triggering Pipeline (FR-11)

Goal: Trigger matching automatically when properties or filters change.

### Subtasks

- [x] Define trigger events and payload contracts for `property.created`, `property.updated`, and `filter.created`.
- [x] Add integration point in property creation flow to dispatch matching job/event.
- [x] Add integration point in property update flow to dispatch matching job/event.
- [x] Add integration point in filter creation flow to dispatch matching job/event.
- [x] Implement trigger handler to resolve target entity and invoke matching service.
- [x] Add idempotency guard so repeated trigger delivery does not duplicate processing side effects.
- [x] Add failure handling and retries/logging strategy for trigger execution.
- [x] Ensure trigger execution is scoped to relevant filters/properties only (avoid full-table scans when possible).
- [x] Add integration tests for each trigger source and handler invocation.

## Task 7 - Match Persistence and Deduplication (FR-12)

Goal: Persist user-property matches and guarantee no duplicates.

### Subtasks

- [x] Define `matches` table schema (id, userId, propertyId, filterId, matchedAt, createdAt).
- [x] Add foreign keys to users/properties/filters with appropriate delete behavior.
- [x] Add unique constraint/index to prevent duplicate matches (at least on `userId + propertyId`).
- [x] Implement repository methods: createMatch, findMatch, listMatchesByUser, listMatchesByProperty.
- [x] Implement upsert or conflict-ignore strategy for duplicate-safe inserts.
- [x] Persist match reason/metadata if required by the matching contract.
- [x] Add service layer orchestration to write all new matches from trigger results.
- [x] Add endpoint/retrieval contract for viewing stored matches (if exposed in MVP scope).
- [x] Add unit tests for deduplication and repository conflict behavior.
- [x] Add integration tests validating stored matches and duplicate prevention.

## Task 8 - Properties Serving Model (MVP Integration)

Goal: Introduce a backend-api `properties` read model while keeping scraper table name as `listings`.

### Subtasks

- [x] Define `properties` table schema in backend-api (id, source, externalListingId, title, price, bedrooms, bathrooms, location, propertyType, url, firstSeenAt, lastSeenAt, status, createdAt, updatedAt).
- [x] Add unique constraint for source identity (`source + external_listing_id`).
- [x] Add indexes for API and matching queries (`status`, `price`, `bedrooms`, `location`, `property_type`, `last_seen_at`).
- [x] Add migration scripts for `properties` table and indexes.
- [x] Implement backend repository methods for property upsert and query by external identity.
- [x] Define normalization mapper from scraper `listings` shape to backend `properties` shape.

## Task 9 - Listings -> Properties Sync Pipeline (MVP Pull Strategy)

Goal: Build a simple incremental sync that reads scraper `listings` and upserts backend `properties`.

### Subtasks

- [x] Define sync contract for source fields read from scraper `listings` (required/optional/defaults).
- [x] Implement watermark-based incremental fetch (`updated_at > last_sync_at`) from scraper database.
- [x] Add sync checkpoint storage in backend-api (`sync_state` table or equivalent) per source.
- [x] Implement idempotent upsert flow in backend-api for each fetched listing.
- [x] Implement inactive handling when listing disappears or is marked unavailable (soft status change in `properties`).
- [x] Add command/script to run full backfill from existing scraper `listings`.
- [x] Add command/script to run incremental sync (cron-friendly).
- [x] Ensure sync process emits `property.created` and `property.updated` triggers for Task 6 pipeline.

## Task 10 - Sync Reliability and Visibility (MVP)

Goal: Make sync safe to operate in production-like environments with clear observability.

### Subtasks

- [x] Add structured logging for sync start/end, counts, duration, and failures.
- [x] Add retry policy for transient DB failures during read/upsert.
- [x] Add dead-letter/error capture for malformed listings and continue processing.
- [x] Add health/diagnostic endpoint or admin query for last successful sync time and lag.
- [x] Add unit tests for mapper, watermark progression, and idempotent upsert behavior.
- [x] Add integration tests for backfill and incremental sync scenarios.

## Task 11 - Notification Creation (FR-13)

Goal: Generate a notification whenever a new user-property match is created.

### Subtasks

- [x] Define notification domain model and event contract (`match.created` -> notification payload).
- [x] Add `notifications` table schema (id, userId, matchId, channel, subject, body, status, createdAt, updatedAt).
- [x] Add foreign keys to users and matches with appropriate delete behavior.
- [x] Add repository methods: createNotification, listByUser, markSent, markFailed.
- [x] Integrate notification creation into match persistence flow (only for newly created matches).
- [x] Add idempotency guard to avoid duplicate notifications for the same match/channel.
- [x] Add unit tests for notification creation service logic.
- [x] Add integration test to verify match creation triggers notification record creation.

## Task 12 - Notification Delivery (FR-14)

Goal: Deliver notifications through email for MVP.

### Subtasks

- [x] Choose and configure email provider abstraction (SMTP or provider SDK) via environment variables.
- [x] Implement email template builder for match alerts (subject + body with property details and filter context).
- [x] Implement delivery service to send pending email notifications.
- [x] Add retry-safe send flow so transient failures do not lose notifications.
- [x] Update notification status lifecycle (`pending` -> `sent` / `failed`).
- [x] Add command/worker entrypoint for processing outbound notifications.
- [x] Add unit tests for email payload formatting and delivery error handling.
- [x] Add integration test with mocked provider verifying successful send and status update.

## Task 13 - Notification Preferences (FR-15)

Goal: Support instant notifications now and keep digest mode ready for future rollout.

### Subtasks

- [x] Add notification preference model linked to users (mode: `instant` for MVP, `digest` reserved).
- [x] Add DB migration for preferences with sane defaults (`instant`).
- [x] Expose profile/preferences API to read and update notification mode.
- [x] Enforce MVP behavior: instant sends enabled; digest mode stored but not dispatched yet.
- [x] Design digest aggregation contract and scheduler interface for future implementation.
- [x] Add unit tests for preference validation and mode switching behavior.
- [x] Add integration tests for preference update and instant notification path.

## Task 14 - Notification Tracking and Reliability (FR-16)

Goal: Track notification sent status, delivery attempts, and failures with operational visibility.

### Subtasks

- [x] Extend notification storage with tracking fields (`attemptCount`, `lastAttemptAt`, `sentAt`, `failureReason`).
- [x] Implement attempt counter increment on each delivery try.
- [x] Persist failure details and keep failed notifications queryable for troubleshooting.
- [x] Add max-attempt policy and terminal status for exhausted retries.
- [x] Add endpoint/admin query for notification delivery metrics and failed queue visibility.
- [x] Add structured logs for notification attempts, successes, and failures.
- [x] Add unit tests for status transitions and retry state machine.
- [x] Add integration tests covering success, retry, and terminal failure scenarios.

## Task 15 - Multi-Auth Foundation (Email/Password + Clerk) (FR-17)

Goal: Keep email/password authentication working while introducing Clerk as an additional identity provider foundation.

### Subtasks

- [x] Define auth strategy contract supporting multiple providers (`password`, `google`, `facebook`) under one user account.
- [x] Add user identity linkage model (e.g., `user_identities` table: userId, provider, providerUserId, email, createdAt).
- [x] Add database migration with unique constraints (`provider + providerUserId`) and indexes for lookup.
- [x] Extend user service/repository logic to resolve a local user by provider identity or by verified email.
- [x] Add environment configuration for Clerk (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, optional JWKS/cache settings).
- [x] Add adapter service to validate Clerk session/JWT and extract normalized identity claims.
- [x] Ensure backward compatibility: existing email/password register/login flows remain unchanged.
- [x] Add unit tests for identity resolution and provider-linking rules.

## Task 16 - OAuth Login with Google and Facebook via Clerk (FR-18)

Goal: Enable OAuth login using Google and Facebook through Clerk while mapping authenticated identities to backend users.

### Subtasks

- [x] Configure Clerk social connections for Google and Facebook (dashboard/env checklist documented in README).
- [x] Add backend endpoint for OAuth callback/session exchange (or token verification) using Clerk SDK.
- [x] Implement provider mapping logic for `google` and `facebook` identities.
- [x] Implement user provisioning flow for first-time social login (create local user if no linked identity exists).
- [x] Implement account-link flow when social email matches existing local account (safe link policy + conflict handling).
- [x] Issue backend access/refresh tokens for successful Clerk-authenticated users.
- [x] Standardize error responses for invalid/expired Clerk tokens and unsupported provider scenarios.
- [x] Add integration tests for Google/Facebook success, first-login provisioning, and conflict cases.

## Task 17 - Unified Auth UX/API and Security Hardening (FR-19)

Goal: Offer both auth methods in one coherent API with clear documentation, observability, and secure defaults.

### Subtasks

- [ ] Add explicit auth method metadata in user/profile responses (e.g., linked providers list).
- [ ] Provide endpoint to list linked auth providers for the current user.
- [ ] Add endpoint to link/unlink social providers (with safeguards to prevent lockout).
- [ ] Enforce security checks: verified email requirement, nonce/state handling, and replay protection for OAuth flows.
- [ ] Add audit/event logs for auth method usage (password login vs Google/Facebook login).
- [ ] Add rate-limiting and abuse controls specific to OAuth/session exchange endpoints.
- [ ] Update README with complete setup/runbook for Clerk + Google + Facebook and local testing steps.
- [ ] Add end-to-end tests covering mixed auth usage (password account later linked to social, and vice versa).

## Notes

- Update each checkbox as work progresses.
- If scope changes, add new subtasks under the corresponding task.
- Keep this file as the source of truth for implementation progress.
