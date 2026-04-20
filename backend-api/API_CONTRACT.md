# Backend API Contract

This document is the frontend-facing contract for backend API integration.

- Base prefix: `/api`
- Auth: `Authorization: Bearer <accessToken>` for protected endpoints
- Content type: `application/json`

## Conventions

### Validation error format

Most validation failures return `400` with:

```json
{
  "message": "Validation error",
  "issues": [
    {
      "path": "field.path",
      "message": "Validation message"
    }
  ]
}
```

### Auth token response

Used by auth session/login/refresh endpoints:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

## Public endpoints

## `GET /health`

- Auth: no
- `200` response:

```json
{
  "status": "ok",
  "timestamp": "2026-04-20T12:00:00.000Z",
  "database": "connected",
  "auth": {
    "clerk": {
      "mode": "optional",
      "publishableKeyConfigured": true,
      "verificationMethod": "secret_key",
      "enabledSocialProviders": ["google", "facebook"],
      "providers": {
        "google": true,
        "facebook": true
      },
      "ready": true,
      "issues": []
    }
  }
}
```

## `POST /auth/session/exchange`

- Auth: no
- Purpose: preferred Clerk-first login exchange (password/google/facebook)
- Request body:

```json
{
  "provider": "password",
  "sessionToken": "clerk-session-token"
}
```

- `200`: auth token response
- `400`: validation error, invalid state/nonce, or missing/unverified Clerk email
- `401`: invalid Clerk session token
- `409`: replay detected or identity conflict
- `429`: too many attempts

## `POST /auth/register` (deprecated)

- Auth: no
- Request body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

- `201` response:

```json
{
  "id": "uuid",
  "name": "User Name",
  "email": "user@example.com",
  "status": "active",
  "createdAt": "2026-04-20T12:00:00.000Z",
  "updatedAt": "2026-04-20T12:00:00.000Z"
}
```

- `400`: validation error
- `409`: email already in use

## `POST /auth/login` (deprecated)

- Auth: no
- Request body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

- `200`: auth token response
- `400`: validation error
- `401`: invalid credentials

## `POST /auth/oauth` (compatibility endpoint)

- Auth: no
- Request body:

```json
{
  "provider": "google",
  "sessionToken": "clerk-session-token",
  "state": "oauth_state_min16chars",
  "nonce": "oauth_nonce_min16chars"
}
```

- `200`: auth token response
- `400`: validation error / invalid state-nonce / unverified email
- `401`: invalid oauth session token
- `409`: replay detected / identity conflict
- `429`: rate limit

## `POST /auth/refresh`

- Auth: no
- Request body:

```json
{
  "refreshToken": "token"
}
```

- `200`: auth token response
- `400`: validation error
- `401`: invalid refresh token

## `POST /auth/logout`

- Auth: no
- Request body:

```json
{
  "refreshToken": "token"
}
```

- `204`: no content
- `400`: validation error

## Protected endpoints

All endpoints below require `Authorization: Bearer <accessToken>`.

## `GET /users/me`

- `200` response:

```json
{
  "id": "uuid",
  "name": "User Example",
  "email": "user@example.com",
  "linkedProviders": ["password", "google"],
  "status": "active",
  "createdAt": "2026-04-20T12:00:00.000Z",
  "updatedAt": "2026-04-20T12:00:00.000Z",
  "deletedAt": null
}
```

- `401`: unauthorized
- `404`: profile not found

## `PATCH /users/me`

- Request body (at least one field):

```json
{
  "name": "New Name",
  "email": "new@example.com"
}
```

- `200`: same shape as `GET /users/me`
- `400`: validation error
- `401`: unauthorized
- `404`: profile not found
- `409`: email already in use

## `DELETE /users/me`

- `204`: no content
- `401`: unauthorized
- `404`: profile not found

## `GET /users/me/auth-providers`

- `200` response:

```json
{
  "userId": "uuid",
  "linkedProviders": ["password", "google", "facebook"]
}
```

- `401`: unauthorized

## `POST /users/me/auth-providers/link`

- Request body:

```json
{
  "provider": "facebook",
  "sessionToken": "clerk-session-token",
  "state": "oauth_state_min16chars",
  "nonce": "oauth_nonce_min16chars"
}
```

- `200`: same shape as `GET /users/me/auth-providers`
- `400`: validation error / unverified email / invalid state-nonce
- `401`: invalid oauth session token
- `404`: profile not found
- `409`: identity already linked / email mismatch / replay
- `429`: rate limit

## `DELETE /users/me/auth-providers/:provider`

- Path param `provider`: `google` or `facebook`
- `200`: same shape as `GET /users/me/auth-providers`
- `400`: validation error
- `401`: unauthorized
- `404`: provider link not found
- `409`: cannot unlink last authentication provider

## `GET /users/me/preferences`

- `200` response:

```json
{
  "userId": "uuid",
  "mode": "instant",
  "createdAt": "2026-04-20T12:00:00.000Z",
  "updatedAt": "2026-04-20T12:00:00.000Z"
}
```

- `401`: unauthorized

## `PATCH /users/me/preferences`

- Request body:

```json
{
  "mode": "digest"
}
```

- `200`: same shape as `GET /users/me/preferences`
- `400`: validation error
- `401`: unauthorized

## `GET /notifications/status`

- `200` response:

```json
{
  "metrics": {
    "pendingCount": 0,
    "sentCount": 0,
    "failedCount": 0
  },
  "failed": [
    {
      "id": "uuid",
      "userId": "uuid",
      "matchId": "uuid",
      "status": "failed",
      "attemptCount": 3,
      "lastAttemptAt": "2026-04-20T12:00:00.000Z",
      "sentAt": null,
      "failedAt": "2026-04-20T12:00:00.000Z",
      "failureReason": "SendGrid timeout",
      "updatedAt": "2026-04-20T12:00:00.000Z"
    }
  ]
}
```

- `401`: unauthorized

## `POST /filters`

- Request body: any valid filter payload with at least one criterion

```json
{
  "priceMin": 100000,
  "priceMax": 300000,
  "bedroomsMin": 2,
  "location": "Douglas",
  "propertyType": "house",
  "keywords": ["garden", "parking"]
}
```

- `201` response: filter object
- `400`: validation error
- `401`: unauthorized

Filter object shape:

```json
{
  "id": "uuid",
  "priceMin": 100000,
  "priceMax": 300000,
  "bedroomsMin": 2,
  "bedroomsMax": null,
  "bathroomsMin": null,
  "bathroomsMax": null,
  "location": "Douglas",
  "propertyType": "house",
  "keywords": ["garden", "parking"],
  "createdAt": "2026-04-20T12:00:00.000Z",
  "updatedAt": "2026-04-20T12:00:00.000Z"
}
```

## `GET /filters`

- `200` response:

```json
{
  "items": [
    {
      "id": "uuid",
      "priceMin": null,
      "priceMax": null,
      "bedroomsMin": null,
      "bedroomsMax": null,
      "bathroomsMin": null,
      "bathroomsMax": null,
      "location": null,
      "propertyType": null,
      "keywords": [],
      "createdAt": "2026-04-20T12:00:00.000Z",
      "updatedAt": "2026-04-20T12:00:00.000Z"
    }
  ]
}
```

- `401`: unauthorized

## `PATCH /filters/:id`

- Path param `id`: uuid
- Request body: any subset of filter fields
- `200`: filter object
- `400`: validation error
- `401`: unauthorized
- `404`: filter not found

## `DELETE /filters/:id`

- Path param `id`: uuid
- `204`: no content
- `400`: validation error
- `401`: unauthorized
- `404`: filter not found
- `409`: minimum filter constraint

## `GET /matches/me`

- `200` response:

```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "propertyId": "uuid",
      "filterId": "uuid",
      "matchReasons": ["price_range", "location"],
      "matchedAt": "2026-04-20T12:00:00.000Z",
      "createdAt": "2026-04-20T12:00:00.000Z"
    }
  ]
}
```

- `401`: unauthorized

## `POST /saved-properties`

- Request body:

```json
{
  "propertyId": "uuid"
}
```

- `201` or `200`: saved-property object (idempotent when already saved)
- `400`: validation error
- `401`: unauthorized
- `404`: property not found

Saved-property object shape:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "propertyId": "uuid",
  "savedAt": "2026-04-20T12:00:00.000Z",
  "property": {
    "id": "uuid",
    "source": "chrystals",
    "externalListingId": "listing-123",
    "title": "Modern apartment",
    "price": 250000,
    "bedrooms": 2,
    "bathrooms": 1,
    "location": "Douglas",
    "propertyType": "apartment",
    "url": "https://example.com/listing-123",
    "status": "active",
    "lastSeenAt": "2026-04-20T12:00:00.000Z"
  }
}
```

## `GET /saved-properties`

- Query params:
  - `limit` (1-100, default `50`)
  - `offset` (>=0, default `0`)
  - `sortBy` (`savedAt` | `price` | `lastSeenAt`, default `savedAt`)
  - `sortOrder` (`asc` | `desc`, default `desc`)
- `200` response:

```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "propertyId": "uuid",
      "savedAt": "2026-04-20T12:00:00.000Z",
      "property": {
        "id": "uuid",
        "source": "chrystals",
        "externalListingId": "listing-123",
        "title": "Modern apartment",
        "price": 250000,
        "bedrooms": 2,
        "bathrooms": 1,
        "location": "Douglas",
        "propertyType": "apartment",
        "url": "https://example.com/listing-123",
        "status": "active",
        "lastSeenAt": "2026-04-20T12:00:00.000Z"
      }
    }
  ]
}
```

- `400`: validation error
- `401`: unauthorized

## `DELETE /saved-properties/:propertyId`

- Path param `propertyId`: uuid
- `204`: no content
- `400`: validation error
- `401`: unauthorized
- `404`: saved property not found

## `GET /sync/status`

- `200` response:

```json
{
  "states": [
    {
      "key": "scraper:listings:all",
      "lastSyncAt": "2026-04-20T12:00:00.000Z",
      "lagSeconds": 42
    }
  ]
}
```

- `401`: unauthorized

## Frontend integration notes

- Prefer `POST /auth/session/exchange` for all sign-in methods.
- Treat `POST /auth/register`, `POST /auth/login`, and `POST /auth/oauth` as compatibility endpoints.
- Handle `401` by redirecting to auth; handle `429` with retry/backoff UI.
- For forms, render `issues[]` from validation responses when available.
