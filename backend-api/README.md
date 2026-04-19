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
ENFORCE_MIN_ONE_FILTER=false
EMAIL_FROM=no-reply@home-radar.local
SENDGRID_API_KEY=
```

Notes:

- `DATABASE_URL`: backend-api write/read DB.
- `SCRAPER_DATABASE_URL`: DB used to read scraper `listings`.
- `SCRAPER_SYNC_BATCH_SIZE`: max rows per incremental pull.
- `SCRAPER_SYNC_RETRY_ATTEMPTS`: retry attempts for transient sync failures.
- `ENFORCE_MIN_ONE_FILTER`: optional free-tier rule for filters delete behavior.
- `EMAIL_FROM`: sender used for outbound match alert emails.
- `SENDGRID_API_KEY`: SendGrid API key used by the notification worker. If empty, email sending falls back to log mode.

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

Current migrations include users, refresh tokens, search filters, properties, sync state, matches, sync dead letters, notifications, and notification preferences.

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
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Protected (Bearer access token):

- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/me/preferences`
- `PATCH /api/users/me/preferences`
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
