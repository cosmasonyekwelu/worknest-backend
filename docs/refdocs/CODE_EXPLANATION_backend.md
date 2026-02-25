# WorkNest Backend Explanation

## 1. Project Overview

### What is WorkNest backend?
The backend is the main server for WorkNest. It handles:
- user and admin authentication,
- job posting and search,
- applications,
- profile updates,
- contact requests,
- and file uploads.

### Non-technical summary
If frontend is the "face" of WorkNest, backend is the "brain" and "record keeper." It receives requests, checks permissions, talks to the database, and sends clean responses.

---

## 2. Tech Stack

### Backend technologies used
- **Node.js + Express**: REST API server.
- **MongoDB + Mongoose**: document database and schema modeling.
- **JWT**: access/refresh token authentication.
- **Cookie Parser**: reads refresh token cookies.
- **CORS**: controls allowed client origins.
- **Helmet + Compression**: security headers and response compression.
- **Multer**: handles file uploads.
- **Cloudinary**: stores uploaded images/files.
- **Bcrypt**: password hashing.
- **Nodemailer/Brevo integrations**: email workflows.
- **Winston + Morgan**: logging.
- **Zod**: request validation schemas.
- **Express-rate-limit**: rate limiting for sensitive routes.

### Why this stack makes sense
- Fast development with JavaScript across full stack.
- MongoDB suits evolving startup-style data models.
- JWT + refresh cookie gives a practical auth balance.
- Middleware-based design keeps code modular.

---

## 3. Project Structure

Main backend directory: `backend codebase/`

Important folders:
- `index.js` → entry point and middleware setup.
- `src/routes/` → endpoint definitions by domain.
- `src/controllers/` → request handlers (HTTP-level logic).
- `src/services/` → business logic and database operations.
- `src/models/` → Mongoose schemas.
- `src/middleware/` → auth, validation, error handling, upload, cache, rate-limit.
- `src/lib/` → shared utilities (tokens, response helpers, schemas, cloudinary config).
- `src/config/` → database connection and logger.

This separation is good because each layer has a clear job.

---

## 4. Frontend-to-Backend Contract (API Design)

Backend is versioned under:
- `/api/v1/auth`
- `/api/v1/admin`
- `/api/v1/jobs`
- `/api/v1/applications`
- `/api/v1/contact`

Example route assembly:

```js
// backend codebase/index.js
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/contact", contactRoutes);
```

---

## 5. Backend Implementation

### A) Main server setup

```js
// backend codebase/index.js
const allowOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

app.use(cors({
  origin: allowOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(helmet(helmetOptions));
app.use(compression(compressionOptions));
```

Step-by-step:
1. Reads allowed frontend origins from env.
2. Enables credentialed CORS (needed for refresh-token cookie).
3. Parses cookies and JSON payloads.
4. Applies security/compression middleware.

---

### B) Authentication routes

```js
// backend codebase/src/routes/userRoutes.js
router.post("/create", validateFormData(validateSignUpSchema), register);
router.post("/login", rateLimiter, validateFormData(validateSignInSchema), login);
router.get("/user", verifyAuth, cacheMiddleware("auth_user", 3600), authenticateUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyAuth, clearCache("auth_user"), logout);
```

These routes implement signup/login/session refresh/logout with validation and protection middleware.

---

### C) JWT and refresh cookie logic

```js
// backend codebase/src/lib/token.js
export const signToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES,
  });
  return { accessToken, refreshToken };
};

export const createSendToken = (user) => {
  const token = signToken(user._id);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth/refresh-token",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  return { accessToken: token.accessToken, refreshToken: token.refreshToken, cookieOptions };
};
```

Why this is important:
- Access token is short-lived and sent in auth header.
- Refresh token is in httpOnly cookie, reducing JS access risk.

---

### D) Verify auth middleware

```js
// backend codebase/src/middleware/authenticate.js
if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
  token = req.headers.authorization.split(" ")[1];
}

const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
const currentUser = await User.findById(decoded.id);
req.user = currentUser;
```

This middleware:
1. Reads bearer token.
2. Verifies JWT signature.
3. Loads current user from DB.
4. Attaches user to request for later role checks.

---

### E) Role-based access control

```js
// backend codebase/src/middleware/authenticate.js
export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(forbiddenResponse("You do not have permission to perform this action"));
    }
    next();
  };
};
```

This prevents applicants from hitting admin endpoints.

---

### F) Key route handlers (examples)

#### User registration/login controller

```js
// backend codebase/src/controllers/auth.controller.js
export const register = tryCatchFn(async (req, res, next) => {
  const user = await authService.register(req, next);
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user);
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Registration successful", 201);
});

export const login = tryCatchFn(async (req, res, next) => {
  const user = await authService.login(req, next);
  const { accessToken, refreshToken, cookieOptions } = createSendToken(user);
  res.cookie("userRefreshToken", refreshToken, cookieOptions);
  return successResponse(res, { accessToken }, "Login successful", 200);
});
```
**Explanation:**
1. **`tryCatchFn`**: A wrapper that automatically catches any errors and passes them to the global error handler.
2. **`authService.register`**: Handles the actual creation of the user in the database.
3. **`createSendToken`**: Generates JWT tokens for the new user.
4. **`res.cookie`**: Securely stores the refresh token in an HTTP-only cookie.

```javascript
// src/middleware/authMiddleware.js (simplified)
export const protect = tryCatchFn(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new AppError("You are not logged in", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  req.user = currentUser;
  next();
});
```
**Explanation:**
1. **Token Extraction**: Checks the `Authorization` header for a Bearer token.
2. **Verification**: Uses JWT to verify the token's validity.
3. **User Retrieval**: Finds the user in the database based on the ID in the token.
4. **Request Enrichment**: Attaches the user object to the request so subsequent handlers can access it.


#### Job creation handler

```js
// backend codebase/src/controllers/job.controller.js
router.post(
  "/create",
  verifyAuth,
  authorizedRoles("admin"),
  uploadImage.single("avatar"),
  createJobs,
);
```

Inside `createJobs`, it validates required fields, optionally uploads company avatar to Cloudinary, then creates a `Jobs` document.

#### Application submission route

```js
// backend codebase/src/routes/applicationRoutes.js
router.post(
  "/:jobId/apply",
  verifyAuth,
  authorizedRoles("applicant"),
  upload.single('resume'),
  applyForJob
);
```

This route requires applicant auth and accepts resume file upload.

---

### G) Error handling middleware

```js
// backend codebase/src/middleware/errorHandler.js
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message, name: err.name };
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
```

Development gives detailed stack traces; production avoids leaking sensitive internals.

---

## 6. Database

### Database system
- **MongoDB** with Mongoose schemas.

### DB connection logic

```js
// backend codebase/src/config/db.server.js
const conn = await mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DATABASE_NAME,
  serverSelectionTimeoutMS: 45000,
  maxPoolSize: 50,
});
```

Includes retry and graceful shutdown handling.

### Core models

#### User model
```js
// backend codebase/src/models/user.js
role: {
  type: String,
  enum: ["applicant", "admin"],
  default: "applicant",
},
savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Jobs" }]
```

#### Jobs model
```js
// backend codebase/src/models/jobs.js
status: {
  type: String,
  enum: ["active", "draft", "closed"],
  default: "draft",
},
applicationQuestions: { type: [String] }
```

#### Application model
```js
// backend codebase/src/models/application.js
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

status: {
  type: String,
  enum: ["submitted", "in_review", "shortlisted", "interview", "offer", "rejected", "hired"],
  default: "submitted",
}
```

### Relationships
- One **User** can save many **Jobs**.
- One **User** can submit many **Applications**.
- One **Job** can receive many **Applications**.
- `Application` has unique `(applicant, job)` index to block duplicate apply attempts.

### Migrations/seeding
- No explicit migration or seed files are visible in this snapshot.

---

## 7. Key Features (Backend)

### 1) Auth system with refresh flow
- Register/login issue access + refresh tokens.
- Refresh token is cookie-based endpoint.
- Middleware validates access token and attaches user context.

### 2) Job management
- Admin can create/update/delete jobs.
- Public or optional-auth browsing for jobs list.
- Applicant-specific save/unsave job endpoints.

### 3) Application processing
- Applicant submits resume + personal data.
- Admin can list all applications, update status, add notes.
- Status history tracks change timeline.

### 4) Validation and rate limiting
- Zod validation in `validateFormData` middleware.
- `rateLimiter` used for sensitive actions like login/forgot-password.

---

## 8. Deployment & Configuration

### Key config files
- `backend codebase/package.json` → scripts/dependencies.
- `backend codebase/index.js` → app bootstrap.
- `backend codebase/src/config/db.server.js` → database setup.
- Root `vercel.json` (frontend routing).

### Environment variables used
From code and README:
- `NODE_ENV`
- `PORT`
- `CLIENT_URL`
- `MONGO_URI`
- `DATABASE_NAME`
- `JWT_SECRET_KEY`
- `JWT_ACCESS_TOKEN_EXPIRES`
- `JWT_REFRESH_TOKEN_EXPIRES`
- Email provider variables
- Cloudinary variables

These are used for security, DB connection, auth expiry, CORS, and file storage.

---

## 9. Testing

Backend `package.json` has a placeholder test script:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

No backend unit/integration test files were found in this repository snapshot.

---

## 10. Conclusion

WorkNest backend is structured with a clear layered architecture (routes → controllers → services → models). It supports real-world hiring workflows: secure authentication, job lifecycle management, and application tracking.

The team built practical features like role-based access, resume upload, and robust middleware. A likely next step is adding automated test coverage and possibly API documentation (Swagger/Postman collection) for easier maintenance and onboarding.
