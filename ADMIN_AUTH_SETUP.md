# Admin Authentication System Documentation

## Overview
This document explains the admin authentication flow for the Worknest Backend API.

## System Flow

### 1. Admin Registration
- Users register as normal users via `/api/v1/auth/create`
- All new users are assigned the role `"applicant"` by default
- No special admin registration endpoint is needed

### 2. Admin Role Assignment
- After registration, we must manually update the user's role in the database
- Update the `role` field from `"applicant"` to `"admin"` in the User collection


### 3. Admin Login
**Endpoint:** `POST /api/v1/admin/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Restrictions:**
- Only users with `role: "admin"` can login via this route
- Attempting to login with `role: "applicant"` will return a 403 Forbidden error
- Error message: "Only admins can access this route. Please contact an administrator to upgrade your account."

**Response:**
```json
{
  "status": "success",
  "message": "Admin login successful",
  "data": {
    "accessToken": "jwt_token_here"
  }
}
```

The response includes an access token (JWT) and an `adminRefreshToken` cookie.

### 4. Prevent Admin Login via User Route
**Endpoint:** `POST /api/v1/auth/login`

**Protection:**
- If an admin tries to login via the user login route, they will be rejected
- Error message: "Admins must use the admin login route. Please visit /api/admin/login"
- This ensures admins can only access the system through the dedicated admin login route

### 5. Get Admin Profile
**Endpoint:** `GET /api/v1/admin/profile`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Requirements:**
- Admin must be authenticated
- Admin role is validated to ensure privileges haven't been revoked
- Returns cached response (3600 seconds)

**Response:**
```json
{
  "status": "success",
  "message": "Admin authenticated",
  "data": {
    "_id": "user_id",
    "email": "admin@example.com",
    "fullname": "Admin Name",
    "role": "admin",
    "isVerified": true
  }
}
```

### 6. Refresh Admin Access Token
**Endpoint:** `POST /api/v1/admin/refresh-token`

**Automatic:**
- The system automatically sends `adminRefreshToken` as a cookie
- No explicit request body needed

**Returns:**
- New access token
- Admin role is re-validated on refresh

## Key Features

### 1. Role-Based Separation
- **User routes:** `/api/v1/auth/*` - For applicants only
- **Admin routes:** `/api/v1/admin/*` - For admins only

### 2. Privilege Revocation IMPORTANT
- If an admin's role is changed back to applicant in the database, they will be denied access:
  - On next profile request
  - On next token refresh
- Current JWT token remains valid until expiration

### 3. Rate Limiting
- Admin login endpoint includes rate limiting to prevent brute force attacks
- Same as user login rate limiting

## User Roles

- **applicant**: Regular user, can only login via `/api/v1/auth/login`
- **admin**: Administrator, can only login via `/api/v1/admin/login`

## Database Schema
The User model has a `role` field:
```javascript
role: {
  type: String,
  enum: ["applicant", "admin"],
  default: "applicant",
}
```

## Middleware Used

### verifyAuth
- Validates JWT token from Authorization header
- Extracts user ID from token
- Loads user from database
- Attaches user to `req.user`

### authorizedRoles
- Checks if user's role matches allowed roles
- Returns 403 Forbidden if role doesn't match
- Usage: `authorizedRoles("admin")`

### validateFormData
- Validates request body against schemas
- Uses `validateSignInSchema` for login endpoints

### rateLimiter
- Limits login attempts to prevent brute force
- Applied to both user and admin login endpoints

### cacheMiddleware
- Caches admin profile responses for 3600 seconds
- Reduces database queries for frequently accessed data

## Error Handling

### Common Admin Login Errors

| Error | Status | Cause |
|-------|--------|-------|
| Admin account not found | 401 | Email doesn't exist |
| Only admins can access this route | 403 | User role is not admin |
| Incorrect email or password | 401 | Wrong password |
| Admins must use the admin login route | 403 | Admin trying to use user login |

## API Summary

### Authentication Routes
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|----------------|
| POST | `/api/v1/auth/create` | User registration | None |
| POST | `/api/v1/auth/login` | User login | Applicant |
| GET | `/api/v1/auth/user` | Get user profile | Applicant |
| POST | `/api/v1/auth/refresh-token` | Refresh user token | None |

### Admin Routes
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|----------------|
| POST | `/api/v1/admin/login` | Admin login | Admin |
| GET | `/api/v1/admin/profile` | Get admin profile | Admin |
| POST | `/api/v1/admin/refresh-token` | Refresh admin token | None |

