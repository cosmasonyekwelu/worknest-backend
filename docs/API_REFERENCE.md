# WorkNest Backend API Reference 

This document defines the **stable API contract** for the WorkNest backend.
It is derived directly from the approved backend README and represents the **authoritative agreement** between backend, frontend, and mobile clients.

This document describes **what the backend guarantees**, not how UI behaves.

---

# 1. Global API Conventions

## Base URL

```
/api
```

All endpoints documented below are relative to this base path.

---

## Authentication

* JWT Bearer authentication
* Access token required for all protected routes
* Refresh tokens used to obtain new access tokens
* Logout invalidates refresh tokens

Header:

```
Authorization: Bearer <accessToken>
```

---

## Date & Time Format

All timestamps are ISO-8601 UTC:

```
2026-01-24T10:30:15.000Z
```

---

## Pagination (All List Endpoints)

All list endpoints are paginated.

**Query Parameters**

* `page` (default: 1)
* `limit` (default: 20, max: 100)

**Response Envelope**

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 320
  }
}
```

---

## Global Error Envelope

All errors use the same structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": ["email is required"]
  }
}
```

### Common Error Codes

* `UNAUTHORIZED`
* `FORBIDDEN`
* `NOT_FOUND`
* `VALIDATION_ERROR`
* `CONFLICT`
* `RATE_LIMITED`
* `INTERNAL_ERROR`

---

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1700000000
```

---

# 2. Authentication Domain

## POST /auth/register

Create a new user account

**Auth:** Public

**Body**

```json
{ "email": "user@mail.com", "password": "StrongPass123" }
```

**Validation Rules**

* Valid email format
* Password ≥ 8 characters

**201 Response**

```json
{ "message": "Registration successful" }
```

**Errors**

* `CONFLICT` (email already exists)

---

## POST /auth/login

Authenticate user or admin

**Auth:** Public

**Body**

```json
{ "email": "user@mail.com", "password": "StrongPass123" }
```

**200 Response**

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": { "id": "u1", "role": "USER" }
}
```

---

## POST /auth/refresh

Refresh access token

**Auth:** Refresh token required

---

## POST /auth/logout

Invalidate refresh token

**Auth:** Required

---

# 3. User Profile Domain

## GET /users/me

Return authenticated user profile

**Auth:** Required

**200 Response**

```json
{
  "id": "u1",
  "email": "user@mail.com",
  "profile": {
    "name": "John Doe",
    "phone": "+234...",
    "avatarUrl": "https://..."
  }
}
```

---

## PATCH /users/me

Update profile fields

**Validation Rules**

* name ≤ 100 characters
* phone must be E.164 format

---

## POST /users/me/avatar

Upload avatar image

**Field Name:** `avatar`

---

## POST /users/me/resume

Upload resume file

**Field Name:** `resume`

---

## GET /users/me/resume

Retrieve resume URL

---

# 4. Jobs Domain (Public)

## GET /jobs

List active jobs with search and filters

**Query Parameters**

* `keyword`
* `location`
* `type`
* `salaryMin`
* `salaryMax`

---

## GET /jobs/{jobId}

Get job details

**Errors**

* `NOT_FOUND`

---

## GET /jobs/recommended

Get personalized job recommendations

**Auth:** USER

---

# 5. Saved Jobs Domain

## POST /jobs/{jobId}/save

Save job

**Auth:** USER

**Errors**

* `CONFLICT` (already saved)

---

## DELETE /jobs/{jobId}/save

Remove saved job

**Auth:** USER

---

## GET /jobs/saved

List saved jobs

**Auth:** USER

---

# 6. Applications Domain

## POST /applications

Submit job application

**Auth:** USER

**Body (multipart/form-data)**

* `jobId`
* `resume` (file)
* `coverLetter` (file)

**Validation Rules**

* Job must be `ACTIVE`
* One application per user per job

**201 Response**

```json
{ "id": "app1", "status": "PENDING" }
```

**Errors**

* `JOB_CLOSED`
* `ALREADY_APPLIED`

---

## GET /applications/me

List applications submitted by the authenticated user

**Auth:** USER

---

## GET /applications/{id}

Get application status

**Auth:** USER

---

# 7. Admin – Jobs Domain

All admin routes require **ADMIN role**.

---

## GET /admin/jobs

List all jobs (any status)

---

## POST /admin/jobs

Create job

**Body**

```json
{ "title": "Backend Engineer", "company": "WorkNest", "status": "DRAFT" }
```

---

## PATCH /admin/jobs/{jobId}

Update job details or status

**Allowed Status Values**

* DRAFT
* ACTIVE
* CLOSED

> Job lifecycle is enforced server-side.
> Frontend must rely on backend validation for transitions.

---

## DELETE /admin/jobs/{jobId}

Delete job

---

# 8. Admin – Applications Domain

## GET /admin/applications

List all applications

---

## GET /admin/jobs/{jobId}/applications

List applications for a specific job

---

## PATCH /admin/applications/{applicationId}/status

Update application status

**Body**

```json
{ "status": "INTERVIEW" }
```

**Allowed Status Values**

* PENDING
* REVIEWED
* INTERVIEW
* OFFER
* REJECTED

**Errors**

* `INVALID_STATUS_TRANSITION`

---

# 9. System Endpoints

## GET /health

Liveness check

**200 Response**

```json
{ "status": "ok", "service": "worknest-api" }
```

---

# 10. Business Status Codes

| Code                      | Meaning                            |
| ------------------------- | ---------------------------------- |
| JOB_CLOSED                | Job no longer accepts applications |
| ALREADY_APPLIED           | Duplicate application              |
| INVALID_STATUS_TRANSITION | Workflow violation                 |
| NOT_JOB_OWNER             | Unauthorized admin access          |

---

## Contract Stability Rule

This document defines the **stable API contract**.

Any breaking change requires:

* explicit versioning
* README update
* changelog entry
* frontend/mobile alignment

---

