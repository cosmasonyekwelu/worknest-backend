# Admin Authentication System - Implementation Summary

## Files Created

### 1. **src/controllers/admin.controller.js**
- `adminLogin()` - Handles admin login with role validation
- `authenticateAdmin()` - Retrieves and validates admin profile
- `refreshAdminAccessToken()` - Refreshes admin access token with role validation

### 2. **src/services/admin.service.js**
- `adminLogin()` - Login service that:
  - Finds user by email
  - Checks if user role is "admin"
  - Validates password
  - Rejects non-admin users (403 error)
  
- `authenticateAdmin()` - Authenticates and validates admin status
  
- `refreshAdminAccessToken()` - Refreshes token with admin role verification

### 3. **src/routes/adminRoutes.js**
New admin route endpoints:
- `POST /api/v1/admin/login` - Admin login (rate limited)
- `GET /api/v1/admin/profile` - Get admin profile (requires auth + admin role)
- `POST /api/v1/admin/refresh-token` - Refresh admin token

## Files Modified

### 1. **src/services/auth.service.js**
Updated `login()` function to:
- Check if user role is "admin"
- Reject admin users from user login route (403 error)
- Only allow "applicant" role users to login via `/api/v1/auth/login`

### 2. **index.js**
- Added import for `adminRoutes`
- Registered admin routes at `/api/v1/admin` endpoint

## Security Features Implemented

✅ **Role-Based Access Control**
- Admins can ONLY login via `/api/v1/admin/login`
- Applicants can ONLY login via `/api/v1/auth/login`
- Separate login endpoints prevent unauthorized access

✅ **Privilege Validation**
- Role checked on every protected request
- Revoked admins denied access immediately
- Role re-validated on token refresh

✅ **Rate Limiting**
- Applied to admin login endpoint
- Prevents brute force attacks

✅ **Secure Token Management**
- Separate refresh token for admins (`adminRefreshToken`)
- JWT-based access tokens
- HttpOnly cookies for refresh tokens

## Registration & Admin Assignment Flow

1. **User Registration**
   ```
   POST /api/v1/auth/create
   ```
   - User registers with email, password, fullname
   - Default role set to "applicant"

2. **Database Admin Promotion**
   ```javascript
   // MongoDB
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```

3. **Admin Login**
   ```
   POST /api/v1/admin/login
   ```
   - Login with promoted admin account
   - Only accessible to role="admin" users

## API Endpoints Overview

### User Endpoints
```
POST   /api/v1/auth/create              (Register)
POST   /api/v1/auth/login               (Login - applicants only)
GET    /api/v1/auth/user                (Get profile - requires auth)
POST   /api/v1/auth/refresh-token       (Refresh token)
```

### Admin Endpoints
```
POST   /api/v1/admin/login              (Login - admins only)
GET    /api/v1/admin/profile            (Get admin profile - requires auth + admin role)
POST   /api/v1/admin/refresh-token      (Refresh token)
```

## Testing Guide

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123",
    "fullname": "New Admin"
  }'
```

### 2. Promote User to Admin (via MongoDB/Database)
```javascript
db.users.updateOne(
  { email: "newadmin@example.com" },
  { $set: { role: "admin" } }
)
```

### 3. Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123"
  }'
```

### 4. Get Admin Profile
```bash
curl -X GET http://localhost:5000/api/v1/admin/profile \
  -H "Authorization: Bearer <access_token_from_login>"
```

### 5. Test Restriction - User Cannot Login via Admin Route
```bash
# This will FAIL with 403 error
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regularuser@example.com",
    "password": "password123"
  }'
```

### 6. Test Restriction - Admin Cannot Login via User Route
```bash
# This will FAIL with 403 error
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123"
  }'
```

## Key Design Decisions

1. **Separate Login Endpoints**
   - Clearer role-based access control
   - Better security audit trails
   - Prevents unauthorized privilege escalation

2. **Manual Admin Assignment**
   - Admins are created in the user collection first
   - Role is then promoted via database update
   - No separate admin registration endpoint


3. **Separate Refresh Tokens**
   - `adminRefreshToken` for admins
   - `userRefreshToken` for users
