# WorkNest API Reference

Base URL (local): `http://localhost:5000/api/v1`

## Conventions

- Most protected routes require `Authorization: Bearer <access_token>`.
- Refresh tokens are handled via HTTP-only cookies.
- Some endpoints use multipart form uploads.

---

## Auth Routes (`/auth`)

### `POST /auth/create`
Register a new user.

### `POST /auth/login`
Login for applicant users.

### `GET /auth/user`
Get authenticated user profile.

### `POST /auth/refresh-token`
Refresh access token using refresh-token cookie.

### `PATCH /auth/verify-account`
Verify account with verification token.

### `POST /auth/resend/verify-token`
Resend verification token.

### `POST /auth/forgot-password`
Start forgot-password flow.

### `PATCH /auth/reset-password`
Reset password with reset token flow payload.

### `PATCH /auth/update-password`
Update password for authenticated user.

### `PATCH /auth/update-user`
Update user profile fields.

### `PATCH /auth/upload-avatar`
Upload user avatar (`multipart/form-data`, field: `avatar`).

### `DELETE /auth/delete-account`
Delete authenticated user account.

### `POST /auth/logout`
Logout authenticated user.

---

## Admin Routes (`/admin`)

### `POST /admin/login`
Admin-only login endpoint.

### `GET /admin/profile`
Get authenticated admin profile.

### `POST /admin/refresh-token`
Refresh admin access token.

### `PATCH /admin/profile`
Update admin profile.

### `PATCH /admin/upload-avatar`
Upload admin avatar.

### `PATCH /admin/profile/password`
Update admin password.

### `GET /admin/all`
Get all users (admin only).

### `DELETE /admin/:id/delete-account`
Delete a user account by ID (admin only).

### `DELETE /admin/delete-account`
Delete current admin profile account.

### `POST /admin/logout`
Logout authenticated admin.

---

## Job Routes (`/jobs`)

### `POST /jobs/create`
Create a job (admin only, supports avatar upload).

### `GET /jobs/all`
Get all jobs (supports optional authentication).

### `GET /jobs/:id`
Get job details by ID.

### `PATCH /jobs/:id/update`
Update job by ID (admin only).

### `DELETE /jobs/:id/delete`
Delete job by ID (admin only).

### `PATCH /jobs/:jobId/upload-avatar`
Upload or replace job avatar image.

### `GET /jobs/saved`
List saved jobs for authenticated applicant.

### `POST /jobs/:id/save`
Save a job (applicant only).

### `DELETE /jobs/:id/save`
Unsave a job (applicant only).

---

## Application Routes (`/applications`)

### `POST /applications/:jobId/apply`
Apply for a job (`multipart/form-data`, field: `resume`, applicant only).

### `GET /applications/me`
Get current applicant's applications.

### `GET /applications/:id`
Get application details by ID (applicant or admin).

### `GET /applications`
Get all applications (admin only).

### `PATCH /applications/:id/status`
Update application status (admin only).

### `PATCH /applications/:id/note`
Update application internal note (admin only).

### `GET /applications/stats/overview`
Get application stats overview (admin only).

---

## Contact Routes (`/contact`)

### `POST /contact/send`
Submit contact request.
