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
- [ ] Implement password hashing (argon2 or bcrypt).
- [ ] Implement POST /auth/register endpoint.
- [ ] Return safe response without passwordHash.
- [ ] Handle duplicate email and validation errors.
- [ ] Add unit tests for hashing and validation.
- [ ] Add integration tests for registration success/failure cases.

## Task 2 - Authentication and Token Lifecycle (FR-2)

Goal: Authenticate users and provide secure token issuance, expiration, and renewal.

### Subtasks

- [ ] Implement POST /auth/login endpoint.
- [ ] Verify credentials with secure password comparison.
- [ ] Configure JWT access token issuance with short expiration.
- [ ] Design refresh token model and persistence strategy.
- [ ] Implement POST /auth/refresh endpoint.
- [ ] Implement POST /auth/logout endpoint (token revoke).
- [ ] Add token claims contract (sub, email, iat, exp, jti).
- [ ] Add auth middleware/guard for protected routes.
- [ ] Implement refresh token expiration and rotation policy.
- [ ] Add unit tests for token generation/verification.
- [ ] Add integration tests for login, refresh, expiration, and revoke scenarios.

## Task 3 - User Profile Management (FR-3)

Goal: Allow authenticated users to retrieve, update, and delete their profile.

### Subtasks

- [ ] Implement GET /users/me endpoint.
- [ ] Implement PATCH /users/me endpoint.
- [ ] Define and validate editable fields for profile updates.
- [ ] Implement DELETE /users/me endpoint.
- [ ] Revoke all user refresh tokens when account is deleted.
- [ ] Decide and implement deletion strategy (soft delete or hard delete).
- [ ] Enforce authorization so users can only access their own profile.
- [ ] Standardize profile route response and error contracts.
- [ ] Add unit tests for update and delete logic.
- [ ] Add integration tests for retrieve/update/delete profile flows.

## Notes

- Update each checkbox as work progresses.
- If scope changes, add new subtasks under the corresponding task.
- Keep this file as the source of truth for implementation progress.
