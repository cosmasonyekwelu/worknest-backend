# WorkNest Backend System Design

This document describes the **high-level backend architecture** of the WorkNest platform derived from the Figma flows. It focuses on structure, responsibilities, data movement, and scaling — not endpoint details.

---

## 1. Architectural Overview

WorkNest is designed as a **modular monolith with clear bounded contexts**, deployable as a single service initially and separable into microservices as scale demands.

The backend acts as the **system of record** for all clients (web, admin, mobile) and owns all business rules.

```
[ Web / Admin / Mobile ]
            |
            v
      [ API Gateway ]
            |
            v
   [ Backend Application ]
            |
  -------------------------
  | Auth | Jobs | Apps | Admin |
  -------------------------
            |
            v
        [ MongoDB ]
            |
    ------------------
    | Cloudinary | SMTP |
    ------------------
```

---

## 2. Bounded Contexts & Modules

### Authentication & Identity Context
**Responsibilities:**
- User & admin authentication
- JWT issuance and rotation
- Password reset & email verification

**Owns:** User credentials, tokens

---

### User Profile Context
**Responsibilities:**
- Profile data management
- Avatar upload

**Owns:** User profile fields

---

### Job Management Context
**Responsibilities:**
- Job lifecycle (draft → active → closed)
- Public job visibility
- Admin job management

**Owns:** Job entity

---

### Application Context
**Responsibilities:**
- Job application submission
- Status transitions
- Admin review workflow

**Owns:** Application entity, invariants

---

### Saved Jobs Context
**Responsibilities:**
- Bookmarking jobs for users

**Owns:** SavedJob entity

---

### Notification Context (System)
**Responsibilities:**
- Email delivery
- Event-driven notifications

**Owns:** Notification triggers, templates

---

## 3. Services & Responsibilities

```
Backend Service
 ├── Auth Service
 ├── User Service
 ├── Job Service
 ├── Application Service
 ├── Admin Service
 ├── Notification Worker
 └── File Upload Adapter
```

All services communicate **in-process** via domain events (for now) and expose functionality via REST controllers.

---

## 4. Communication Patterns

### Client → Backend
- REST (JSON over HTTPS)
- JWT authentication

### Backend → External Services
- Cloudinary (file uploads)
- SMTP (email)

### Internal Communication
- Domain events (in-memory, async-ready)

---

## 5. Key Domain Events (Event Storming Style)

```
UserRegistered
EmailVerified
PasswordResetRequested
JobCreated
JobPublished
JobClosed
ApplicationSubmitted
ApplicationStatusUpdated
JobSaved
JobUnsaved
```

These events are used to:
- Trigger emails
- Enforce workflows
- Decouple side effects

---

## 6. Critical Data Flows

### A. Job Discovery Flow
```
Client → API → Job Service → MongoDB → API → Client
```

### B. Application Submission Flow
```
Client → API
       → Auth Check
       → Application Service
       → MongoDB (write)
       → Cloudinary (CV upload)
       → Event: ApplicationSubmitted
       → Notification Worker → Email
```

### C. Admin Review Flow
```
Admin → API → Admin Service
      → Application Service (status update)
      → MongoDB
      → Event: ApplicationStatusUpdated
      → Notification Worker
```

---

## 7. Persistence Strategy

| Bounded Context | Storage | Notes |
|----------------|---------|-------|
| Auth / Users | MongoDB | Encrypted fields, indexes |
| Jobs | MongoDB | Indexed for search |
| Applications | MongoDB | High write volume |
| Saved Jobs | MongoDB | Simple join-like access |
| Notifications | MongoDB (optional) | Audit trail |

Binary files are **never stored in DB** — only URLs.

---

## 8. Authentication & Authorization Enforcement

```
Request
  ↓
Auth Middleware (JWT validation)
  ↓
Authorization Guard (role + ownership)
  ↓
Controller → Service → DB
```

Enforcement points:
- Middleware (token validation)
- Guards (role / ownership)
- Service-level invariants

---

## 9. Caching & Queue Usage (Planned)

### Caching
- Job listings (read-heavy)
- Job details
- Admin dashboard metrics

Tool: Redis (TTL-based)

### Queues / Background Jobs
- Email sending
- File post-processing
- Future: notifications, analytics

Tool: BullMQ / Redis

---

## 10. Horizontal Scaling Considerations

- Stateless API (JWT-based)
- Horizontal scaling behind load balancer
- MongoDB Atlas auto-scaling
- Redis shared cache
- Background workers scaled independently

```
[ LB ]
  |
[ API x N ]
  |
[ MongoDB / Redis / Workers ]
```

---

This design intentionally balances **startup speed with architectural correctness**, enabling fast delivery without blocking future scale.

