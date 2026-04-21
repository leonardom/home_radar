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

- [x] Add explicit auth method metadata in user/profile responses (e.g., linked providers list).
- [x] Provide endpoint to list linked auth providers for the current user.
- [x] Add endpoint to link/unlink social providers (with safeguards to prevent lockout).
- [x] Enforce security checks: verified email requirement, nonce/state handling, and replay protection for OAuth flows.
- [x] Add audit/event logs for auth method usage (password login vs Google/Facebook login).
- [x] Add rate-limiting and abuse controls specific to OAuth/session exchange endpoints.
- [x] Update README with complete setup/runbook for Clerk + Google + Facebook and local testing steps.
- [x] Add end-to-end tests covering mixed auth usage (password account later linked to social, and vice versa).

## Task 18 - Saved Properties (FR-17, FR-18)

Goal: Allow authenticated users to save/bookmark properties and manage their saved list.

### Subtasks

- [x] Define saved property domain model (`id`, `userId`, `propertyId`, `createdAt`).
- [x] Add database schema/migration for `saved_properties` table.
- [x] Add foreign keys to users/properties with safe delete behavior.
- [x] Add unique constraint/index for duplicate prevention (`user_id + property_id`).
- [x] Add repository methods: `saveProperty`, `listSavedByUser`, `removeSavedByUserAndProperty`, `isSavedByUser`.
- [x] Implement FR-17 endpoint to save/bookmark property (e.g. `POST /saved-properties`).
- [x] Implement FR-18 endpoint to view saved properties (e.g. `GET /saved-properties`).
- [x] Implement FR-18 endpoint to remove saved property (e.g. `DELETE /saved-properties/:propertyId`).
- [x] Enforce authorization so users can only manage their own saved properties.
- [x] Ensure idempotent save behavior (saving an already saved property should not duplicate records).
- [x] Standardize response and error contracts (not found, validation, ownership).
- [x] Add optional filter/sort/pagination contract for saved properties listing.
- [x] Add unit tests for repository and service dedup/remove behaviors.
- [x] Add integration tests for save/list/remove flows and auth checks.

## Task 19 - Clerk-First Auth Design and Migration Contract (MIG-CLERK-1)

Goal: Define the target architecture to use Clerk as the source of truth for email/password and social authentication (Google, Facebook), while preserving existing user/profile behavior.

### Subtasks

- [x] Define and document target auth architecture (Clerk-managed authentication, backend-managed domain profile).
- [x] Confirm token strategy for backend authorization (Clerk JWT verification only, or Clerk session exchange to local API tokens).
- [x] Define canonical identity model and mapping contract (`clerkUserId`, primary email, provider list, verification status).
- [x] Define account linking policy for same-email identities across password/Google/Facebook.
- [x] Define conflict policy (email collision, unverified email, provider mismatch, deleted user recovery).
- [x] Define endpoint contract changes/deprecations for `/auth/register`, `/auth/login`, `/auth/oauth`, and any new Clerk-focused endpoint(s).
- [x] Define migration compatibility window and API versioning/backward compatibility rules.
- [x] Define observability contract (auth method tags, success/failure events, security events).
- [x] Define security requirements checklist (nonce/state/replay/rate limits, verified email, lockout prevention).

## Task 20 - Clerk Provider Setup and Environment Hardening (MIG-CLERK-2)

Goal: Configure Clerk and application environments to support Clerk email/password and social login for Google/Facebook safely across local/staging/production.

### Subtasks

- [ ] Enable Clerk email/password authentication in the Clerk dashboard and align password policy requirements.
- [ ] Configure Google OAuth provider in Clerk (client ID/secret, redirect URIs, scopes) for all environments.
- [ ] Configure Facebook OAuth provider in Clerk (app ID/secret, redirect URIs, scopes) for all environments.
- [ ] Validate Clerk redirect/callback URLs for frontend and backend integration flows.
- [x] Add/validate required environment variables (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_API_URL`, optional JWT/JWKS cache config).
- [x] Add environment validation guards so startup fails fast on missing/invalid Clerk config.
- [x] Add provider-specific health checks or startup diagnostics for OAuth readiness.
- [x] Update local development setup docs for Clerk email/password + Google/Facebook testing.

Note: Remaining pending subtasks in Task 20 are manual Clerk Dashboard operations. A detailed execution and acceptance runbook is documented in `backend-api/README.md` under "Clerk Dashboard Runbook (Manual Task 20 Steps)".

## Task 21 - Backend Auth Flow Refactor to Clerk (MIG-CLERK-3)

Goal: Replace local password authentication flows with Clerk identity verification and ensure user provisioning/linking works consistently for email/password and social providers.

### Subtasks

- [x] Refactor auth service to accept Clerk-authenticated sessions for both email/password and social logins.
- [x] Introduce/adjust endpoint for Clerk session token exchange/verification (single unified auth entrypoint).
- [x] Ensure provider normalization supports `password`, `google`, and `facebook` in one resolution path.
- [x] Rework user resolution logic to prioritize linked identity, then verified email fallback with safe linking.
- [x] Ensure first login provisioning creates local user profile from Clerk user claims with deterministic defaults.
- [x] Implement explicit provider-link and provider-unlink safeguards (cannot remove last sign-in method).
- [x] Keep profile and downstream ownership semantics based on local user ID (no behavioral regressions in domain modules).
- [x] Preserve or migrate refresh/access token lifecycle according to selected strategy in Task 19.
- [x] Remove legacy local password hash
- [x] Add/update structured logs and metrics for method-specific outcomes (`password`, `google`, `facebook`).

## Task 22 - Data Migration, Testing, and Production Cutover (MIG-CLERK-4)

Goal: Finalize Clerk-first authentication rollout with full test coverage and production cutover readiness.

Scope note: No legacy auth users were deployed to production, so legacy backfill and compatibility migration tasks are intentionally out of scope.

### Subtasks

- [x] Add unit tests for identity merge/link/unlink/conflict branches in Clerk-first flows.
- [x] Add integration tests for sign-up/sign-in via Clerk email/password end-to-end.
- [x] Add integration tests for Google and Facebook first-login provisioning and returning-user login.
- [x] Add integration tests for mixed Clerk auth scenarios (email/password user links Google/Facebook, and vice versa).
- [x] Add integration tests for security controls (invalid token, replay attempts, nonce/state mismatch, rate-limited flows).
- [x] Add regression suite for protected routes to confirm no authorization breakage after migration.
- [x] Prepare rollout plan with phased enablement (dev -> staging -> production) and explicit rollback steps.
- [x] Add release checklist with monitoring gates and post-cutover verification queries.

## Notes

- Update each checkbox as work progresses.
- If scope changes, add new subtasks under the corresponding task.
- Keep this file as the source of truth for implementation progress.

---

## Frontend Web App Task Tracker (HomeRadar SaaS)

Status legend:

- [ ] Pending
- [x] Completed

Execution note:

- Planning complete in this file.
- Implementation should begin only after explicit go-ahead.

## FE-1 - Frontend Workspace Bootstrap and Tooling

Goal: Scaffold a production-ready Next.js App Router frontend with TypeScript and core quality tooling.

### Subtasks

- [x] Create a new `frontend` app in the monorepo using Next.js (App Router + TypeScript).
- [x] Configure Tailwind CSS with design tokens (color, spacing, radius, shadows, motion).
- [x] Add and configure a clean component system (`shadcn/ui` or equivalent) with base primitives.
- [x] Set up ESLint/Prettier conventions aligned with repo standards.
- [x] Define environment variables and validation for frontend runtime (`NEXT_PUBLIC_API_BASE_URL`, Clerk keys).
- [x] Add base folder structure: `app/`, `components/`, `features/`, `lib/`, `hooks/`, `types/`, `styles/`.
- [x] Add global providers shell (`QueryClientProvider`, Clerk provider, theme tokens, toast host).
- [x] Validate baseline commands (`npm run dev`, `npm run build`, `npm run lint`, tests).

## FE-2 - Design System and UX Foundations

Goal: Establish a cohesive, accessible SaaS visual system with reusable UI patterns.

### Subtasks

- [x] Define CSS variables for brand palette (indigo/blue primary, emerald accent, neutral grayscale).
- [x] Implement typography scale, spacing scale, elevation system, and container rhythm.
- [x] Build reusable components: buttons, inputs, badges, cards, section wrappers, empty states.
- [x] Add motion primitives for hover/focus, reveal transitions, and reduced-motion support.
- [x] Implement responsive breakpoints and mobile-first layout constraints.
- [x] Add accessibility baseline: focus-visible states, semantic landmarks, ARIA patterns.
- [x] Create skeleton components for list/card/form loading states.

## FE-3 - Routing and App Architecture

Goal: Build maintainable route groups and shared layout structure for public, auth, and protected experiences.

### Subtasks

- [x] Create App Router groups: `(public)`, `(auth)`, `(protected)`.
- [x] Implement root layout with metadata, providers, base styles, and viewport settings.
- [x] Add route-level layouts for public pages and authenticated application shell.
- [x] Define navigation component variants for logged-out and logged-in states.
- [x] Implement global error and not-found pages with branded UX.
- [x] Add route constants and typed navigation helpers.

## FE-4 - Clerk Authentication Integration

Goal: Integrate Clerk for email/password, Google, and Facebook, and align with backend exchange flow.

### Subtasks

- [x] Configure Clerk frontend SDK and environment wiring.
- [x] Implement `/sign-in` page using Clerk-compatible flow + product-tailored UI.
- [x] Implement `/sign-up` page with email/password + social options.
- [x] Ensure social auth options include Google and Facebook in the UX.
- [x] Implement session handling and token retrieval needed for backend exchange.
- [x] Integrate `POST /api/auth/session/exchange` to obtain backend access/refresh tokens.
- [x] Persist backend tokens securely on client side strategy (cookie or secure storage pattern).
- [x] Implement refresh flow via `POST /api/auth/refresh` and logout via `POST /api/auth/logout`.
- [x] Add robust error handling for `401`, `409`, `429`, and validation payloads.

## FE-5 - API Client, React Query, and Type Safety Layer

Goal: Implement a typed API layer and data fetching architecture for all frontend features.

### Subtasks

- [x] Build API client wrapper with base URL from env and standardized headers.
- [x] Add auth-aware request interceptor/middleware for bearer token injection.
- [x] Add centralized error mapper for backend validation format (`issues[]`).
- [x] Define TypeScript DTO/domain types for all consumed endpoints.
- [x] Implement React Query key factory for auth/user/filters/matches/saved-properties.
- [x] Implement query/mutation hooks for each endpoint in API contract.
- [x] Configure sensible stale time, retries, and cache invalidation patterns.
- [x] Add optimistic mutation patterns where UX benefits (filters/saved properties).

## FE-6 - Validation Strategy with Backend Parity

Goal: Ensure frontend forms enforce the same rules as backend validation.

### Subtasks

- [x] Build Zod schemas for auth forms and filter form aligned to backend constraints.
- [x] Confirm parity for min/max numeric constraints and required-at-least-one-filter-criterion rules.
- [x] Integrate schemas with React Hook Form resolvers.
- [x] Implement reusable field-level error rendering and server error mapping.
- [x] Disable submit buttons when forms are invalid/submitting.
- [x] Add validation tests for schemas to prevent contract drift.
- [x] Document source-of-truth mapping to backend contract sections.

## FE-7 - Public Landing Page (/)

Goal: Deliver a high-converting, responsive, polished SaaS landing page.

### Subtasks

- [x] Implement hero section with required headline/subheadline and two CTAs.
- [x] Add abstract visual/illustration treatment optimized for performance.
- [x] Implement features section with 3-4 cards (alerts, filters, aggregation, save/track).
- [x] Implement “How It Works” section with the required 3-step flow.
- [x] Implement pricing section with Free vs Pro comparison and clear CTAs.
- [x] Implement testimonial section with 2-3 realistic mock testimonials.
- [x] Implement FAQ section with core alert/pricing questions.
- [x] Implement footer with Privacy Policy, Terms, and Contact links.
- [x] Ensure mobile-first behavior, contrast compliance, and smooth section transitions.

## FE-8 - Auth-Aware Navigation and Header Behavior

Goal: Render navigation options according to auth state with consistent UX.

### Subtasks

- [x] Logged-out header: logo + Sign In + Register only.
- [x] Logged-in header: Dashboard + Filters + Saved Properties + Profile menu.
- [x] Implement profile dropdown with logout action.
- [x] Add responsive mobile menu behavior for both states.
- [x] Add active route highlighting and keyboard navigation support.

## FE-9 - Protected Routing and Access Control

Goal: Restrict dashboard, filters, and profile routes to authenticated users.

### Subtasks

- [x] Implement route guard middleware/pattern for `(protected)` routes.
- [x] Redirect unauthenticated users to `/sign-in` with return URL support.
- [x] Handle expired/invalid token flow gracefully.
- [x] Ensure no protected content flashes before redirect.
- [x] Add tests for protected-route behavior.

## FE-10 - Dashboard Page (/dashboard)

Goal: Present matched properties with clear cards, states, and useful actions.

### Subtasks

- [x] Integrate `GET /api/matches/me` query and state handling.
- [x] Build card layout with image, price, details, and external listing CTA.
- [x] Include match context (reasons, matched timestamp) in card metadata.
- [x] Add loading skeletons and empty-state UX when no matches exist.
- [x] Add save/unsave affordance if connected to saved properties.
- [x] Ensure responsive grid behavior and accessible card controls.

## FE-11 - Filters Page (/filters)

Goal: Deliver complete filter management with create, edit, delete, and list UX.

### Subtasks

- [x] Build filter form fields: price range, bedrooms, bathrooms, location, keywords.
- [x] Integrate create mutation with `POST /api/filters`.
- [x] Integrate list query with `GET /api/filters`.
- [x] Integrate update mutation with `PATCH /api/filters/:id`.
- [x] Integrate delete mutation with `DELETE /api/filters/:id`.
- [x] Provide inline and toast feedback for success/error states.
- [x] Handle backend `409 minimum filter constraint` with clear UX guidance.
- [x] Apply optimistic updates and rollback for edit/delete actions.
- [x] Add empty state and first-filter onboarding hint.

## FE-12 - Profile Page (/profile)

Goal: Let users view/edit their profile and manage session actions.

### Subtasks

- [ ] Integrate `GET /api/users/me` for profile display.
- [ ] Integrate `PATCH /api/users/me` for name/email updates.
- [ ] Show linked providers from user payload and auth-providers endpoint.
- [ ] Integrate logout action across Clerk + backend logout endpoint.
- [ ] Provide robust error handling (e.g., email conflict `409`).
- [ ] Add account safety messaging around auth provider changes.

## FE-13 - Saved Properties Page (Optional Route)

Goal: Implement saved properties management as an authenticated utility page.

### Subtasks

- [ ] Add route and UI for saved properties list.
- [ ] Integrate `GET /api/saved-properties` with pagination/sort params.
- [ ] Integrate `POST /api/saved-properties` and `DELETE /api/saved-properties/:propertyId`.
- [ ] Add save/unsave controls reusable from dashboard cards.
- [ ] Handle empty/loading/error states with actionable messaging.

## FE-14 - Notifications, Feedback, and UX Polish

Goal: Improve perceived quality with responsive feedback loops and polished states.

### Subtasks

- [ ] Integrate global toast system for success/error/info notifications.
- [ ] Standardize mutation loading states and button busy indicators.
- [ ] Add graceful empty/error/retry components for key pages.
- [ ] Add subtle transitions for card interactions and page sections.
- [ ] Implement retry/backoff UX guidance for throttling (`429`) responses.
- [ ] Ensure CLS-safe image and layout behavior for core pages.

## FE-15 - Testing and Quality Gates

Goal: Ensure implementation stability and prevent regressions.

### Subtasks

- [ ] Add unit tests for utilities, schemas, and API client behavior.
- [ ] Add component tests for key forms and navigation/auth conditions.
- [ ] Add integration tests for core flows: sign-in, create filter, dashboard load, profile update.
- [ ] Add route protection tests (authenticated vs unauthenticated scenarios).
- [ ] Add accessibility checks for major pages and form interactions.
- [ ] Ensure lint/build/test pipelines pass locally and in CI.

## FE-16 - Performance, Security, and Production Hardening

Goal: Prepare the frontend for production deployment and operations.

### Subtasks

- [ ] Verify environment separation and secure key handling across environments.
- [ ] Add security headers and safe defaults in Next.js config where applicable.
- [ ] Optimize bundle splits, image delivery, and route-level loading strategies.
- [ ] Review caching strategy for public vs protected content.
- [ ] Add analytics/telemetry hooks for critical product events (optional if analytics is in scope).
- [ ] Validate Lighthouse baseline for landing and dashboard pages.

## FE-17 - Documentation and Handoff

Goal: Make the frontend easy to run, maintain, and extend.

### Subtasks

- [ ] Add `frontend/README.md` with setup, env vars, scripts, and architecture overview.
- [ ] Document API contract mapping and endpoint usage decisions.
- [ ] Document auth flow (Clerk + backend exchange + refresh/logout lifecycle).
- [ ] Provide page/component map and feature ownership boundaries.
- [ ] Add troubleshooting section for common auth/API/environment issues.
- [ ] Add release checklist for production rollout.
