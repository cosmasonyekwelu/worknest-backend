# WorkNest Backend – Product Requirements Document (PRD)

## 1. Business Goal (Backend Perspective)
The backend must provide a **reliable, secure, and scalable system of record** for the WorkNest job marketplace, enabling job seekers to discover and apply for jobs, and administrators to manage jobs and review candidates. All business rules, state transitions, and data integrity must be enforced server-side to ensure consistency across web and mobile clients.

The backend is responsible for:
- Owning all domain state (users, jobs, applications)
- Enforcing workflow rules (job lifecycle, application status)
- Securing access by role (user vs admin)
- Supporting growth in users, jobs, and applications without redesign

---

## 2. User Roles & Personas (Backend-Relevant)

### Job Seeker (User)
- Authenticates via email/password (JWT)
- Searches and views jobs
- Saves jobs
- Submits applications with documents
- Tracks application status
- Manages personal profile

### Administrator (Admin User)
- Authenticates with elevated privileges
- Creates, edits, publishes, and closes jobs
- Views all applications per job
- Updates application status (review → interview → offer → reject)
- Monitors platform-level metrics (counts, status breakdowns)

### System (Automated Actor)
- Sends emails (verification, reset, notifications)
- Stores and serves uploaded files via Cloudinary
- Enforces token expiration and refresh

---

## 3. Domain Model Overview

### Core Entities

**User**
- id
- email, passwordHash
- role (USER | ADMIN)
- profile (name, phone, country, bio, avatar)
- createdAt

**Job**
- id
- title, description, requirements, benefits
- company
- location, type, salaryRange
- status (DRAFT | ACTIVE | CLOSED)
- postedAt
- createdBy (Admin)

**Application**
- id
- userId → User
- jobId → Job
- cvUrl, coverLetterUrl
- status (SUBMITTED | VIEWED | INTERVIEW | OFFER | REJECTED)
- timestamps

**SavedJob**
- userId → User
- jobId → Job

---

## 4. Backend Features by Bounded Context

### 4.1 Authentication & Identity
- User and admin login
- JWT access + refresh token issuance
- Password reset via email
- Email verification (optional but supported)
- Token refresh endpoint

---

### 4.2 User Profile Management
- View and update profile fields
- Upload avatar (Cloudinary)
- Phone number verification flag

---

### 4.3 Job Management (Admin Context)
- Create job (default status = DRAFT)
- Update job details
- Publish job (DRAFT → ACTIVE)
- Close job (ACTIVE → CLOSED)
- List jobs with filters (status)

---

### 4.4 Job Discovery (Public Context)
- List active jobs only
- Search by keyword, location
- Filter by type, salary range
- View job details

---

### 4.5 Applications (User Context)
- Submit application (1 per user per job)
- Upload CV and cover letter
- View own applications
- View application status timeline

---

### 4.6 Application Review (Admin Context)
- List applications per job
- Update application status
- View applicant profile snapshot

---

### 4.7 Saved Jobs
- Save job
- Remove saved job
- List saved jobs

---

### 4.8 Notifications (System Context)
- Send email on:
  - Password reset
  - Application submitted
  - Status change

---

## 5. Authentication & Authorization Model

- JWT-based authentication
- Access token used for all API calls
- Refresh token used to re-issue access tokens
- Role-based authorization:
  - USER: job discovery, apply, profile
  - ADMIN: job management, application review

Authorization is enforced **per route and per resource**.

---

## 6. Critical Non-Functional Requirements

### Performance
- Job search must respond < 300ms (p95) for typical queries
- Admin listing endpoints must support pagination

### Scalability
- System must support:
  - 100k+ users
  - 10k+ jobs
  - 1M+ applications
- Stateless API (horizontal scaling)

### Data Consistency
- Application submission must be atomic
- Status transitions must be validated
- No duplicate applications per user/job

### Audit & Traceability
- Track status changes with timestamps
- Preserve historical application state

### File Handling
- Backend stores only URLs, not binary files
- All uploads go directly to Cloudinary

### Multi-Tenancy
- Admins manage global job pool

---

## 7. Business Rules & Invariants

- A job in CLOSED state cannot receive new applications
- A user can apply to a job only once
- Only admins can create or modify jobs
- Only job owners/admins can review applications
- Application status must follow allowed transitions
- Only ACTIVE jobs are visible publicly
- Saved jobs do not affect job visibility or application

---

This PRD captures only backend-impacting requirements derived directly from the Figma designs and serves as the authoritative backend scope for implementation.