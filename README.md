# WorkNest Backend API

## Overview (Backend Perspective)
WorkNest Backend is the core API powering the WorkNest job marketplace. It serves as the **authoritative backend** for all clients (web, admin, and mobile), handling authentication, job management, applications, profiles, and admin operations.

The backend is intentionally designed to keep **all business rules server-side** so frontend and mobile clients remain thin and predictable.

---

## Problem This Backend Solves
Frontend and mobile applications need a single, reliable system to:
- Authenticate users and admins securely
- Manage job listings through a full lifecycle (draft → active → closed)
- Accept and track job applications
- Upload and store resumes and media safely
- Send verification and notification emails
- Expose consistent APIs for web and mobile clients

This backend centralizes these responsibilities and exposes a clean REST API.

---

## Tech Stack (and Why)

- **Node.js (Express)** – Simple, fast, and ideal for JSON APIs
- **MongoDB (Atlas)** – Flexible schema for early-stage iteration, ideal for jobs & applications
- **Mongoose** – Explicit models, validation, and relationships
- **JWT (Access + Refresh tokens)** – Secure, stateless auth for web and mobile
- **Cloudinary** – Resume, avatar, and media storage
- **Nodemailer (Gmail SMTP)** – Email verification, password reset, notifications
- **Docker & Docker Compose** – One-command local environment

This stack prioritizes speed of development, clarity, and scalability for startups.

---

## Local Setup (One Command)

### Prerequisites
- Docker
- Docker Compose

### Start backend
```bash
docker-compose up --build
```

API will be available at:
```
http://localhost:4000
```

---

## Environment Variables
Create a `.env` file in the root directory:

```env
# App
NODE_ENV=development
CLIENT_URL=http://localhost:4000
DATABASE_NAME=worknest_server

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net

# Auth
JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ourworknest@email.com
EMAIL_PASSWORD=your_app_password

# File Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
CLOUDINARY_URL=cloudinary://key:secret@name
```

---

## Run in Development Mode (without Docker)
```bash
npm install
npm run dev
```

---

## Health Check Endpoint
Used by frontend and monitoring tools to verify service availability.

```http
GET /health
```

Response:
```json
{ "status": "ok", "service": "worknest-api" }
```

---

## API Usage (Frontend / Mobile)
Below is **one curl example per major domain represented in the Figma designs**.

---

### 1. Authentication (Login)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"password"}'
```

---

### 2. Job Search (Landing / Find Job)
```bash
curl http://localhost:4000/api/jobs?keyword=designer&location=remote
```

---

### 3. Job Details Page
```bash
curl http://localhost:4000/api/jobs/{jobId}
```

---

### 4. Save Job
```bash
curl -X POST http://localhost:4000/api/jobs/{jobId}/save \
  -H "Authorization: Bearer <accessToken>"
```

---

### 5. Apply for Job (CV Upload)
```bash
curl -X POST http://localhost:4000/api/applications \
  -H "Authorization: Bearer <accessToken>" \
  -F "jobId=123" \
  -F "cv=@resume.pdf" \
  -F "coverLetter=@cover.pdf"
```

---

### 6. Track Applications (User)
```bash
curl http://localhost:4000/api/applications/me \
  -H "Authorization: Bearer <accessToken>"
```

---

### 7. Admin – List Jobs
```bash
curl http://localhost:4000/api/admin/jobs \
  -H "Authorization: Bearer <adminAccessToken>"
```

---

### 8. Admin – Create Job
```bash
curl -X POST http://localhost:4000/api/admin/jobs \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Engineer","company":"WorkNest","status":"ACTIVE"}'
```

---

### 9. Admin – View Applications for Job
```bash
curl http://localhost:4000/api/admin/jobs/{jobId}/applications \
  -H "Authorization: Bearer <adminAccessToken>"
```

---

### 10. Admin – Update Application Status
```bash
curl -X PATCH http://localhost:4000/api/admin/applications/{id} \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"INTERVIEW"}'
```

---

## How Frontend & Mobile Clients Should Use This API

- Treat the backend as **authoritative** for all business logic
- Always send JWT via `Authorization: Bearer <token>`
- Handle token refresh using refresh tokens
- Rely on backend status fields (ACTIVE, DRAFT, CLOSED, PENDING, INTERVIEW, OFFER)
- Use Cloudinary URLs returned by the API for media rendering

If you can run `docker-compose up` and hit `/health`, you are ready to build against this backend.

