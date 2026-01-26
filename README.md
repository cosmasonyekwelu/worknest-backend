# WorkNest API

## Overview

WorkNest API is the core backend service powering the WorkNest job marketplace platform. It provides a complete RESTful interface for user authentication, job management, application processing, and administrative operations.

## Key Design Principles

- **Thin Clients**: All business logic resides server-side; clients focus on presentation
- **Consistent API**: Single API surface for web, mobile, and admin interfaces
- **Stateless Authentication**: JWT-based authentication for horizontal scalability
- **Media-First Design**: Built-in support for resumes, avatars, and job media

## Architecture

### Core Domains
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Authentication │    │    Job Catalog  │    │  Applications   │
│  - User/Admin   │───▶│  - Listings     │───▶│  - Submissions  │
│  - JWT tokens   │    │  - Search       │    │  - Tracking     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    File Store   │    │   Notifications │    │   Analytics     │
│  - Cloudinary   │    │  - Nodemailer   │    │  - Monitoring   │
│  - CDN caching  │    │  - Templates    │    │  - Metrics      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Runtime** | Node.js 18+ | Asynchronous I/O for concurrent job applications |
| **Framework** | Express.js | Minimal abstraction with full control |
| **Database** | MongoDB Atlas | Schema flexibility for rapid iteration |
| **ORM/ODM** | Mongoose | Schema validation and relationship management |
| **Authentication** | JWT + bcrypt | Stateless sessions with refresh rotation |
| **File Storage** | Cloudinary | Specialized resume/PDF handling with CDN |
| **Email** | Nodemailer + SMTP | Reliable transactional emails |
| **Containers** | Docker + Compose | Consistent development environments |
| **Testing** | Jest + Supertest | Comprehensive API test coverage |

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 18+ (for native development)
- MongoDB Atlas account (or local MongoDB)

### Docker Development (Recommended)
```bash
# Clone and launch
git clone <repository>
cd worknest-backend
docker-compose up --build

# Verify
curl http://localhost:4000/health
# Expected: {"status":"ok","service":"worknest-api"}
```

### Native Development
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

## Environment Configuration

Create `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/worknest
# For Docker: mongodb://mongodb:27017/worknest

# Authentication
JWT_SECRET=your_256bit_base64_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@worknest.com

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CLOUDINARY_FOLDER=worknest/uploads

# Rate Limiting (requests per window)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## API Testing with Postman

### Collection Setup
1. **Import Collection**: Import `WorkNest.postman_collection.json`
2. **Configure Environment**: 
   - Base URL: `{{baseUrl}}` (set to `http://localhost:4000`)
   - Authentication: Use "Tests" tab to automatically capture tokens

### Authentication Flow (Postman Tests)
Each authentication request includes scripts to automatically store tokens:

```javascript
// In Postman Tests tab for login endpoint
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.accessToken);
    pm.environment.set("refreshToken", jsonData.refreshToken);
}
```

### Common Test Scenarios

#### 1. User Registration & Job Search
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │────▶│  Login      │────▶│  Search Jobs│
│  (POST)     │     │  (POST)     │     │  (GET)      │
└─────────────┘     └─────────────┘     └─────────────┘
```

#### 2. Job Application Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  View Job   │────▶│  Save Job   │────▶│  Apply      │
│  (GET)      │     │  (POST)     │     │  (POST)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

#### 3. Admin Job Management
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Create Job │────▶│  List Apps  │────▶│  Update App │
│  (POST)     │     │  (GET)      │     │  (PATCH)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Core API Endpoints

### Authentication (`/api/auth`)
```http
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/refresh      # Token refresh
POST   /api/auth/logout       # Token invalidation
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Jobs (`/api/jobs`)
```http
GET    /api/jobs              # Search with filters
GET    /api/jobs/:id          # Job details
GET    /api/jobs/saved        # User's saved jobs
POST   /api/jobs/:id/save     # Save job
DELETE /api/jobs/:id/save     # Unsave job
GET    /api/jobs/recommended  # Personalized recommendations
```

### Applications (`/api/applications`)
```http
POST   /api/applications      # Submit application
GET    /api/applications/me   # User's applications
GET    /api/applications/:id  # Application status
```

### User Profile (`/api/users`)
```http
GET    /api/users/me          # Current user profile
PATCH  /api/users/me          # Update profile
POST   /api/users/me/avatar   # Upload avatar
GET    /api/users/me/resume   # Get resume
POST   /api/users/me/resume   # Upload resume
```

### Admin Endpoints (`/api/admin/*`)
```http
# Job Management
GET    /api/admin/jobs
POST   /api/admin/jobs
PATCH  /api/admin/jobs/:id
DELETE /api/admin/jobs/:id

# Application Management
GET    /api/admin/applications
GET    /api/admin/jobs/:id/applications
PATCH  /api/admin/applications/:id/status

# User Management
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
```

## Status Codes & Enums

### Job Status
```javascript
DRAFT:      "DRAFT"      // Job not published
ACTIVE:     "ACTIVE"     // Accepting applications
PAUSED:     "PAUSED"     // Temporarily inactive
CLOSED:     "CLOSED"     // No longer accepting
EXPIRED:    "EXPIRED"    // Auto-closed by system
```

### Application Status
```javascript
PENDING:    "PENDING"    // Submitted, under review
REVIEWED:   "REVIEWED"   // Initial screening passed
INTERVIEW:  "INTERVIEW"  // Scheduled for interview
OFFER:      "OFFER"      // Job offer extended
REJECTED:   "REJECTED"   // Not proceeding

```

## File Upload Specifications

### Resume Upload
- **Format**: PDF, DOC, DOCX
- **Max Size**: 5MB
- **Field Name**: `resume`
- **Response**: Returns Cloudinary URL and public_id

### Avatar Upload
- **Format**: JPG, PNG, WebP
- **Max Size**: 2MB
- **Dimensions**: Auto-cropped to 300x300
- **Field Name**: `avatar`

### Cover Letter
- **Format**: PDF, DOC, DOCX, TXT
- **Max Size**: 2MB
- **Field Name**: `coverLetter`

## Client Integration Guidelines

### 1. Authentication Headers
```javascript
// Always include for protected endpoints
Authorization: Bearer ${accessToken}

// Refresh token flow (client-side)
if (response.status === 401) {
    // Use refresh token to get new access token
    // Retry original request
}
```

### 2. Error Handling
All errors follow the format:
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Email is required",
        "details": { "field": "email" }
    }
}
```

### 3. Pagination
```javascript
// Request
GET /api/jobs?page=1&limit=10

// Response includes metadata
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 45,
        "pages": 5,
        "hasNext": true,
        "hasPrev": false
    }
}
```

### 4. Search & Filtering
```javascript
// Multiple filter support
GET /api/jobs?title=developer&location=remote&experience=senior

// Salary range
GET /api/jobs?salary[min]=50000&salary[max]=100000

// Date filtering
GET /api/jobs?postedAfter=2024-01-01
```

## Development Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Production build
npm run build
npm start

# Testing
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Code quality
npm run lint          # ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting

# Database
npm run db:seed       # Seed test data
npm run db:reset      # Reset database
```

## Monitoring & Health

### Health Endpoints
```http
GET  /health          # Basic service status
GET  /health/db       # Database connectivity
GET  /health/redis    # Cache status
GET  /health/email    # Email service status
```

### Logging Strategy
- **Development**: Colored console output with request details
- **Production**: Structured JSON logs to stdout (Docker capture)
- **Audit Logs**: Sensitive operations (login, application submission)

## Security Considerations

### Implemented
- JWT with short-lived access tokens
- Refresh token rotation
- Password hashing with bcrypt
- Rate limiting per endpoint
- Helmet.js security headers
- CORS configured for client origins
- Input validation with Joi
- NoSQL injection prevention
- File upload scanning

### Client Responsibilities
- Store tokens securely (httpOnly cookies recommended)
- Implement token refresh logic
- Validate all API responses
- Sanitize user inputs before sending
- Implement request timeouts and retries

## Deployment

### Docker Deployment
```bash
# Production build
docker build -t worknest-api .

# Run with environment variables
docker run -p 4000:4000 \
  -e MONGODB_URI=${MONGODB_URI} \
  -e JWT_SECRET=${JWT_SECRET} \
  worknest-api
```

### Environment Checklist
- [ ] MongoDB Atlas cluster configured
- [ ] Cloudinary account with upload preset
- [ ] SMTP service (SendGrid, AWS SES, etc.)
- [ ] Environment variables set
- [ ] SSL certificate configured
- [ ] CDN for static assets
- [ ] Backup strategy for database

## Support & Troubleshooting

### Common Issues
1. **Connection Refused**: Verify Docker/MongoDB is running
2. **Authentication Failures**: Check JWT secret and token expiry
3. **Upload Failures**: Verify Cloudinary credentials and file limits
4. **Email Issues**: Check SMTP credentials and port accessibility

### Debug Mode
Enable detailed logging:
```bash
DEBUG=worknest:* npm run dev
```

## Next Steps
1. Review API documentation at `/api-docs` (when implemented)
2. Explore Postman collection for API testing
3. Set up monitoring with the provided health endpoints
4. Configure environment-specific variables for staging/production

---
*For detailed API specifications, refer to the API Reference documentation.*  
*For contribution guidelines, see CONTRIBUTING.md.*