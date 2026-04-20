# Home Radar Backend API

Backend API service for Home Radar.

This service provides:

- user registration and authentication (JWT + refresh tokens)
- user profile management
- search filter management
- property match retrieval
- scraper-to-backend property sync (backfill + incremental)
- matching trigger pipeline and sync diagnostics

## Tech Stack

- Node.js 22
- TypeScript
- Fastify
- Drizzle ORM + PostgreSQL
- Zod validation
- Vitest for tests
- ESLint + Prettier

## Project Structure

- `src/modules/auth`: register, login, refresh, logout, auth middleware
- `src/modules/users`: `/users/me` profile routes
- `src/modules/filters`: filter CRUD routes and logic
- `src/modules/properties`: properties model, sync pipeline, diagnostics
- `src/modules/matching`: matching logic + trigger dispatcher
- `src/modules/matches`: persisted matches and `/matches/me`
- `src/database/schema.ts`: Drizzle table definitions
- `drizzle/*.sql`: SQL migrations
- `tests/`: unit + integration test suites

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL (backend database)
- Access to scraper PostgreSQL database (can be same DB, different schema/db, or another instance)

## Environment Variables

Copy `.env.example` to `.env` and adjust values.

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/home_radar
SCRAPER_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/home_radar
SCRAPER_SYNC_BATCH_SIZE=200
SCRAPER_SYNC_RETRY_ATTEMPTS=3
JWT_ACCESS_SECRET=dev_access_secret_change_me_1234567890
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7
CLERK_AUTH_MODE=optional
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_JWT_KEY=
CLERK_API_URL=
CLERK_SKIP_JWKS_CACHE=false
CLERK_ENABLED_SOCIAL_PROVIDERS=google,facebook
ENFORCE_MIN_ONE_FILTER=false
EMAIL_FROM=no-reply@home-radar.local
SENDGRID_API_KEY=
NOTIFICATIONS_MAX_ATTEMPTS=3
```

Notes:

- `DATABASE_URL`: backend-api write/read DB.
- `SCRAPER_DATABASE_URL`: DB used to read scraper `listings`.
- `SCRAPER_SYNC_BATCH_SIZE`: max rows per incremental pull.
- `SCRAPER_SYNC_RETRY_ATTEMPTS`: retry attempts for transient sync failures.
- `CLERK_AUTH_MODE`: `optional` (default) or `required`. In `required` mode, startup fails unless Clerk auth is fully configured.
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`: Clerk backend/frontend keys for OAuth foundation.
- `CLERK_JWT_KEY`: optional Clerk JWT verification key for networkless token verification.
- `CLERK_API_URL`: optional Clerk backend API URL override.
- `CLERK_SKIP_JWKS_CACHE`: optional flag to skip JWKS cache during verification.
- `CLERK_ENABLED_SOCIAL_PROVIDERS`: comma-separated list of enabled social providers. Expected values for this project: `google,facebook`.
- `ENFORCE_MIN_ONE_FILTER`: optional free-tier rule for filters delete behavior.
- `EMAIL_FROM`: sender used for outbound match alert emails.
- `SENDGRID_API_KEY`: SendGrid API key used by the notification worker. If empty, email sending falls back to log mode.
- `NOTIFICATIONS_MAX_ATTEMPTS`: max delivery retries before a notification is marked `failed`.

## Install

```bash
npm install
```

## Database Migrations

Run migrations (Drizzle):

```bash
npm run db:migrate
```

Run SQL migrations directly with `psql` (recommended fallback for local Docker Postgres):

```bash
npm run db:migrate:sql
```

Generate SQL from schema (if needed):

```bash
npm run db:generate
```

Current migrations include users, refresh tokens, search filters, properties, sync state, matches, sync dead letters, notifications, notification preferences, notification tracking fields, and user identities.

## Notification Delivery Worker

Process pending email notifications:

```bash
npm run notifications:send
```

Optional batch size:

```bash
npm run notifications:send -- --limit=200
```

## Run the App

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Server starts with values from `HOST` and `PORT`.

## Run Tests

Run all tests once:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## Lint and Format

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## API Overview

All routes are under `/api`.

Public:

- `GET /api/health`
- `POST /api/auth/session/exchange` (Clerk-first login exchange)
- `POST /api/auth/register` (deprecated during migration window)
- `POST /api/auth/login` (deprecated during migration window)
- `POST /api/auth/oauth`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Protected (Bearer access token):

- `GET /api/users/me`
- `GET /api/users/me/auth-providers`
- `POST /api/users/me/auth-providers/link`
- `DELETE /api/users/me/auth-providers/:provider`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/me/preferences`
- `PATCH /api/users/me/preferences`
- `GET /api/notifications/status`
- `POST /api/filters`
- `GET /api/filters`
- `PATCH /api/filters/:id`
- `DELETE /api/filters/:id`
- `GET /api/matches/me`
- `GET /api/sync/status`

## Sync Pipeline (Scraper -> Backend API)

The sync reads `listings` from scraper DB and upserts into backend `properties`.

### Full Backfill

Processes all listings for all sources (or one source):

```bash
npm run sync:backfill
npm run sync:backfill -- --source=chrystals
```

### Incremental Sync

Processes listings where `updated_at > last_sync_at`:

```bash
npm run sync:incremental
npm run sync:incremental -- --source=chrystals
```

### What Sync Does

For each listing:

1. Normalize/map listing fields to backend property shape.
2. Upsert property using unique key `(source, external_listing_id)`.
3. Dispatch matching triggers:
   - `property.created` if new
   - `property.updated` if existing
4. Track the latest `updated_at` as watermark in `sync_state`.

Backfill mode also marks missing properties as `inactive` (soft status update).

### Reliability and Visibility

- Structured logs for start/end, counters, duration.
- Retry policy for transient operations (`SCRAPER_SYNC_RETRY_ATTEMPTS`).
- Dead-letter capture in `sync_dead_letters` for malformed/failed listings.
- Diagnostics endpoint `GET /api/sync/status` for checkpoint lag visibility.

## OAuth Login (Clerk + Google/Facebook)

The backend supports social login through Clerk via:

- `POST /api/auth/oauth`

Request body:

```json
{
  "provider": "google",
  "sessionToken": "<clerk-session-or-jwt-token>",
  "state": "<oauth-state>",
  "nonce": "<oauth-nonce>"
}
```

Supported providers:

- `google`
- `facebook`

Behavior:

- Verifies Clerk session token and normalizes identity claims.
- Resolves local user by linked provider identity.
- If no link exists, links to an existing local account when Clerk email is verified and matches.
- If no local account exists, provisions a new local user and links the provider identity.
- Returns backend access/refresh tokens with the same contract as password login.

Error contracts:

- `401` invalid/expired Clerk token
- `400` validation errors (including unsupported provider)
- `400` missing or unverified email in Clerk claims
- `409` provider identity conflict (already linked to another user)
- `429` rate-limited OAuth/session exchange attempts

### Clerk Readiness Diagnostics

`GET /api/health` now includes Clerk readiness diagnostics under `auth.clerk`:

- auth mode (`optional` or `required`)
- configured verification method (`secret_key`, `jwt_key`, or both)
- enabled provider status (`google`, `facebook`)
- readiness boolean and concrete configuration issues

Startup enforcement:

- In `CLERK_AUTH_MODE=required`, backend startup fails fast if Clerk keys/providers are missing.
- In `NODE_ENV=production`, the same Clerk readiness checks are enforced.

### Clerk Social Setup Checklist

1. Create a Clerk application and copy `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`.
2. In Clerk Dashboard, enable Google and Facebook social connections.
3. Configure provider credentials in Clerk for Google/Facebook.
4. Configure OAuth redirect URLs for your frontend application in Clerk.
5. Set backend environment variables:
   - `CLERK_AUTH_MODE` (`required` recommended in staging/production once migration starts)
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_JWT_KEY` (optional, for local JWT verification)
   - `CLERK_API_URL` (optional override)
   - `CLERK_SKIP_JWKS_CACHE` (optional)
   - `CLERK_ENABLED_SOCIAL_PROVIDERS` (set to `google,facebook`)
6. Restart the backend after env changes.

### Clerk Dashboard Runbook (Manual Task 20 Steps)

Use this section to complete and verify the four remaining manual subtasks in Task 20.

#### A) Environment Matrix

Prepare one Clerk app/environment mapping per deployment target:

| Environment | Frontend URL                | Backend API URL                | Clerk Instance/Environment |
| ----------- | --------------------------- | ------------------------------ | -------------------------- |
| Local       | `http://localhost:3000`     | `http://localhost:3000/api`    | Development                |
| Staging     | `<staging-frontend-url>`    | `<staging-backend-url>/api`    | Staging                    |
| Production  | `<production-frontend-url>` | `<production-backend-url>/api` | Production                 |

Replace placeholders before rollout.

#### B) Enable Email/Password in Clerk

1. Go to Clerk Dashboard -> User & Authentication -> Email, Phone, Username.
2. Enable Email + Password as a sign-in and sign-up strategy.
3. Configure password policy to match product/security requirements.
4. Save and publish the change.

Acceptance checks:

- Email/password appears as enabled in Clerk.
- New user can sign up with email/password in the target environment.

#### C) Configure Google OAuth in Clerk

1. In Clerk Dashboard -> SSO Connections, enable Google.
2. Add Google client ID and client secret for each environment.
3. Confirm allowed redirect URIs are exactly aligned with frontend callback flow.
4. Save and publish the change.

Acceptance checks:

- Google provider status is enabled in Clerk.
- Google sign-in completes and returns a valid Clerk session.

#### D) Configure Facebook OAuth in Clerk

1. In Clerk Dashboard -> SSO Connections, enable Facebook.
2. Add Facebook app ID and app secret for each environment.
3. Confirm allowed redirect URIs are exactly aligned with frontend callback flow.
4. Save and publish the change.

Acceptance checks:

- Facebook provider status is enabled in Clerk.
- Facebook sign-in completes and returns a valid Clerk session.

#### E) Validate Redirect/Callback URLs

For each environment, validate all callback URLs end-to-end:

1. Start from frontend login page.
2. Perform Google sign-in and verify callback returns to correct frontend route.
3. Perform Facebook sign-in and verify callback returns to correct frontend route.
4. Ensure no fallback to unexpected hostname/protocol (for example, http vs https mismatch).

Acceptance checks:

- All callback URLs succeed without provider redirect errors.
- No cross-environment redirect leakage (staging credentials redirecting to production or local).

#### F) Backend Readiness Verification

After manual Clerk setup, enforce strict validation in staging/production:

1. Set `CLERK_AUTH_MODE=required`.
2. Set `CLERK_ENABLED_SOCIAL_PROVIDERS=google,facebook`.
3. Ensure `CLERK_PUBLISHABLE_KEY` and one of `CLERK_SECRET_KEY` or `CLERK_JWT_KEY` are set.
4. Restart backend-api.

Verify readiness:

```bash
curl http://localhost:3000/api/health
```

Expected result:

- `auth.clerk.ready` is `true`.
- `auth.clerk.providers.google` is `true`.
- `auth.clerk.providers.facebook` is `true`.
- `auth.clerk.issues` is an empty array.

### Local Testing Runbook (Clerk + Google/Facebook)

1. Start backend-api locally:

```bash
npm run dev
```

2. From the frontend, complete social sign-in with Clerk and obtain a session token/JWT.
3. Exchange the Clerk token for backend tokens:

```bash
curl -X POST http://localhost:3000/api/auth/oauth \
   -H "Content-Type: application/json" \
   -d '{"provider":"google","sessionToken":"<clerk-token>","state":"<oauth-state>","nonce":"<oauth-nonce>"}'
```

4. Use returned backend access token to inspect linked providers:

```bash
curl http://localhost:3000/api/users/me/auth-providers \
   -H "Authorization: Bearer <backend-access-token>"
```

5. Link an additional social provider to the same account:

```bash
curl -X POST http://localhost:3000/api/users/me/auth-providers/link \
   -H "Authorization: Bearer <backend-access-token>" \
   -H "Content-Type: application/json" \
   -d '{"provider":"facebook","sessionToken":"<facebook-clerk-token>","state":"<oauth-state>","nonce":"<oauth-nonce>"}'
```

6. Unlink a social provider (lockout safeguards apply):

```bash
curl -X DELETE http://localhost:3000/api/users/me/auth-providers/google \
   -H "Authorization: Bearer <backend-access-token>"
```

Expected behavior notes:

- Linking requires verified Clerk email matching the current backend user email.
- Unlinking the last linked social provider is blocked with `409`.
- Invalid Clerk tokens return `401`.
- Excessive OAuth exchange/link attempts from the same client IP return `429`.

## Clerk-First Migration Contract (MIG-CLERK-1)

This section defines the implementation contract for migrating from local auth credentials to Clerk-managed authentication.

### 1) Target Architecture

- Clerk is the source of truth for authentication factors and credential lifecycle (email/password, Google, Facebook).
- Backend API remains the source of truth for domain profile, authorization ownership, and business data.
- Backend authorization continues to use local API access/refresh tokens bound to local `users.id`.
- Identity linkage between Clerk and backend users is represented in `user_identities`.

### 2) Token Strategy (Decision)

Chosen strategy: Clerk session exchange to local API tokens.

- Clients authenticate with Clerk first.
- Client sends Clerk session token/JWT to backend exchange endpoint.
- Backend verifies Clerk token and resolves/provisions/link local user.
- Backend issues local access/refresh tokens used by protected API routes.

Rationale:

- Avoids broad changes to existing auth middleware and protected routes.
- Preserves existing refresh/logout lifecycle and token revocation model.
- Supports phased migration with minimal blast radius.

### 3) Canonical Identity Model

- Canonical external identity key: `clerkUserId`.
- Mapping in backend: `user_identities(provider, provider_user_id, email)` where `provider_user_id` stores Clerk user identity for that provider.
- Supported providers for sign-in: `password`, `google`, `facebook`.
- Primary email source:
  - Local `users.email` remains canonical domain email used in downstream modules.
  - Email is normalized to lowercase.
- Verified email requirement:
  - Auto-link and auto-provision require verified email in Clerk claims.

### 4) Account Linking Policy

- Resolve order on login exchange:
  1.  Existing identity link by `(provider, provider_user_id)`.
  2.  Verified email match against existing active local user.
  3.  If none found, provision new local user.
- If verified email matches an existing local user, link the incoming provider to that user.
- Linking endpoint must reject attempts that would remove the last available sign-in method.
- Provider unlink is allowed only when at least one remaining sign-in method is still linked.

### 5) Conflict Policy

- Email collision (different linked identity, same email): return `409` and do not auto-merge.
- Unverified email from Clerk: return `400` for provisioning/linking flows.
- Provider mismatch (provider identity already linked to another user): return `409`.
- Deleted local user recovery:
  - No silent reactivation.
  - Return `409` with recovery-required contract (manual/admin or dedicated recovery flow).

### 6) Endpoint Contract and Deprecations

- New preferred endpoint: `POST /api/auth/session/exchange`
  - Accepts Clerk session token/JWT and provider metadata.
  - Returns backend access/refresh tokens.
- Existing `POST /api/auth/oauth` remains as compatibility alias during migration window.
- Existing `POST /api/auth/register` and `POST /api/auth/login` become deprecated in docs and logs during migration window.
- Post-migration target:
  - Remove `register/login` local credential entrypoints.
  - Keep `refresh/logout` with unchanged contracts.

### 7) Compatibility Window and API Versioning

- Compatibility window: two releases (or 60 days, whichever is longer).
- During window:
  - New clients must use `POST /api/auth/session/exchange`.
  - Legacy clients may continue using deprecated endpoints.
  - Deprecation warnings are emitted in response headers/logs.
- After window:
  - Disable deprecated local credential routes behind feature flag first.
  - Remove routes in next minor version and document in changelog.

### 8) Observability Contract

Required auth event fields for all auth outcomes:

- `event`: `auth.login.success` | `auth.login.failed` | `auth.link.success` | `auth.link.failed`
- `method`: `password` | `google` | `facebook`
- `provider`: provider name where applicable
- `userId`: local user id when available
- `clerkUserId`: external identity id when available
- `reason`: normalized failure reason (`invalid_token`, `unverified_email`, `identity_conflict`, `rate_limited`, `replay_detected`, `invalid_nonce_state`)
- `requestId`, `ip`, and timestamp

Metrics:

- Success/failure counters by auth method and reason.
- Login exchange latency histogram.
- Link/unlink conflict counters.

### 9) Security Requirements Checklist

- Require verified email before auto-link/provision.
- Validate OAuth `state` and `nonce` for social login exchange.
- Enforce replay protection for Clerk session exchange attempts.
- Enforce per-client/IP rate limits for auth exchange and link endpoints.
- Reject unsupported providers with explicit validation errors.
- Preserve lockout-prevention rule (cannot remove last auth method).
- Keep token verification strict (signature, expiration, issuer/audience as configured).
- Keep structured security logs for incident diagnostics.

## Clerk Rollout Plan (Task 22)

Use this plan to promote Clerk-first authentication safely from development to production.

### Phase 1: Development

1. Ensure Clerk dashboard setup is complete for email/password, Google, and Facebook.
2. Set backend env:

- `CLERK_AUTH_MODE=required`
- `CLERK_ENABLED_SOCIAL_PROVIDERS=google,facebook`
- `CLERK_PUBLISHABLE_KEY=<value>`
- one of `CLERK_SECRET_KEY` or `CLERK_JWT_KEY`

3. Run quality gates:

- `npm run test`
- `npm run lint`

4. Validate auth endpoints manually:

- `POST /api/auth/session/exchange` for `password`, `google`, `facebook`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

5. Verify provider link/unlink behavior and lockout prevention.

Exit criteria:

- All automated checks pass.
- Session exchange succeeds for all configured providers.
- Security controls pass (invalid token, replay, rate limit, invalid provider/state/nonce).

### Phase 2: Staging

1. Deploy backend with the same required Clerk env strategy as development.
2. Run smoke tests for all auth methods and protected-route authorization.
3. Monitor auth logs for at least one full day of expected staging traffic.
4. Validate no increase in `401`, `409`, or `429` rates outside expected security tests.

Exit criteria:

- No auth regressions in staging.
- Protected routes continue to resolve local user ownership correctly.
- Replay/rate-limit protections behave as expected.

### Phase 3: Production

1. Deploy during a low-traffic window.
2. Keep release owner and rollback owner on-call for the first monitoring window.
3. Run post-deploy verification checklist (below) immediately after deploy.
4. Monitor auth outcomes for at least 60 minutes before closing deployment.

Exit criteria:

- Session exchange and token lifecycle are healthy.
- No unexpected error spike.
- Verification queries and endpoint checks are clean.

## Rollback Plan

If production auth regressions are detected:

1. Revert backend deployment to the previous known-good release.
2. Restore previous environment variables for auth mode if they changed.
3. Re-run smoke checks for login, refresh, logout, and protected routes.
4. Keep traffic on the reverted release until root cause is identified and fixed.
5. Record incident timeline, impact, and remediation before next rollout attempt.

## Release Checklist (Task 22)

Pre-release:

1. `npm run test` passes.
2. `npm run lint` passes.
3. Clerk env vars are present and valid for target environment.
4. Dashboard providers enabled and callback URLs validated.

Deployment gates:

1. `GET /api/health` returns `auth.clerk.ready=true`.
2. `auth.clerk.providers.google=true`.
3. `auth.clerk.providers.facebook=true`.
4. `auth.clerk.issues` is empty.

Post-cutover verification:

1. Exchange Clerk session for API tokens (`password`, `google`, `facebook`) and confirm `200`.
2. Confirm refresh and logout contracts still work.
3. Confirm protected routes accept issued access tokens.
4. Confirm link/unlink safeguards (cannot remove last auth provider).

Post-cutover verification queries (PostgreSQL):

```sql
-- Active users
SELECT COUNT(*) AS active_users
FROM users
WHERE status = 'active';

-- Provider distribution in linked identities
SELECT provider, COUNT(*) AS identities
FROM user_identities
GROUP BY provider
ORDER BY provider;

-- Duplicate provider identity rows (must be zero)
SELECT provider, provider_user_id, COUNT(*) AS duplicates
FROM user_identities
GROUP BY provider, provider_user_id
HAVING COUNT(*) > 1;

-- Orphan linked identities (must be zero)
SELECT COUNT(*) AS orphan_identities
FROM user_identities ui
LEFT JOIN users u ON u.id = ui.user_id
WHERE u.id IS NULL;

-- Active refresh tokens linked to non-active users (must be zero)
SELECT COUNT(*) AS invalid_active_refresh_tokens
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.revoked_at IS NULL
  AND rt.expires_at > NOW()
  AND u.status <> 'active';
```

Release closeout:

1. Capture deployment time, commit SHA, and environment.
2. Attach checklist evidence (endpoint responses + query outputs).
3. Record any follow-up actions in `TASKS.md`.

## Matching and Persistence Notes

- Matching rules evaluate price, bedrooms, location, keywords, and property type.
- Matches are persisted in `matches` with dedup constraint by `(user_id, property_id)`.
- Match metadata includes reasons and timestamps.

## Docker

Build and run container:

```bash
docker build -t home-radar-backend-api .
docker run --rm -p 3000:3000 --env-file .env home-radar-backend-api
```

The Dockerfile uses a multi-stage build and runs `node dist/server.js`.

## Typical Local Workflow

1. Configure `.env`.
2. Install deps: `npm install`.
3. Run migrations: `npm run db:migrate`.
4. Start API: `npm run dev`.
5. Execute sync once for initial data:
   - `npm run sync:backfill`
6. Run incremental sync on a schedule:
   - `npm run sync:incremental`
7. Validate quality:
   - `npm run lint && npm run build && npm run test`
