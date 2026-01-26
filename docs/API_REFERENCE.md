# WorkNest Backend API Reference

This document defines the **contract-first API specification** for the WorkNest backend derived from the Figma screens. It is the authoritative contract between backend, frontend, and mobile clients.

This document describes **what the API guarantees**, not how UI behaves.

---

# 1. Global API Conventions

## Base URL
```
/api/v1
```

---

## Authentication

- JWT Bearer authentication
- Access token required for protected routes

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

**Query Parameters**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

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

All errors use the same shape:

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
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

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
- Valid email format
- Password ≥ 8 characters

**201 Response**
```json
{ "message": "Registration successful" }
```

**Errors**
- `CONFLICT` (email already exists)

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

**Auth:** Refresh token

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
- name ≤ 100 chars
- phone must be E.164

---

# 4. Jobs Domain (Public)

## GET /jobs
List active jobs

**Query Parameters**
- `keyword`
- `location`
- `type`
- `salaryMin`
- `salaryMax`

---

## GET /jobs/{jobId}
Get job details

**Errors**
- `NOT_FOUND`

---

# 5. Saved Jobs Domain

## POST /jobs/{jobId}/save
Save job

**Auth:** USER

**Errors**
- `CONFLICT` (already saved)

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
- `jobId`
- `cv` (file)
- `coverLetter` (file)

**Validation Rules**
- Job must be ACTIVE
- One application per user per job

**201 Response**
```json
{ "id": "app1", "status": "SUBMITTED" }
```

**Errors**
- `JOB_CLOSED`
- `ALREADY_APPLIED`

---

## GET /applications/me
List user applications

---

# 7. Admin – Jobs Domain

## POST /admin/jobs
Create job

**Auth:** ADMIN

**Body**
```json
{ "title": "Backend Engineer", "status": "DRAFT" }
```

---

## PATCH /admin/jobs/{jobId}
Update job

**Auth:** ADMIN

---

## PATCH /admin/jobs/{jobId}/publish
Publish job

---

## PATCH /admin/jobs/{jobId}/close
Close job

---

# 8. Admin – Applications Domain

## GET /admin/jobs/{jobId}/applications
List applications for a job

---

## PATCH /admin/applications/{applicationId}
Update application status

**Body**
```json
{ "status": "INTERVIEW" }
```

**Allowed Status Values**
- SUBMITTED
- VIEWED
- INTERVIEW
- OFFER
- REJECTED

**Errors**
- `INVALID_STATUS_TRANSITION`

---

# 9. System Endpoints

## GET /health
Liveness check

**200 Response**
```json
{ "status": "ok" }
```

---

# 10. Business Status Codes

| Code | Meaning |
|------|--------|
| JOB_CLOSED | Job no longer accepts applications |
| ALREADY_APPLIED | Duplicate application |
| INVALID_STATUS_TRANSITION | Workflow violation |
| NOT_JOB_OWNER | Unauthorized admin access |

---

This document defines the **stable API contract**. Breaking changes require versioning and changelog updates.

