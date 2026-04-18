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

## Notes

- Update each checkbox as work progresses.
- If scope changes, add new subtasks under the corresponding task.
- Keep this file as the source of truth for implementation progress.
