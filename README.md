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
- **Brevo** – Email verification, password reset, notifications
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
http://localhost:5000
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# App
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_NAME=worknest_server

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net

# Auth
JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_SECRET_KEY=your_access_secret
JWT_REFRESH_SECRET_KEY=your_refresh_secret
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=Worknest

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


