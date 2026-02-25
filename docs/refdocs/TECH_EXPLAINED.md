# WORKNEST Technology Explained (Simple Version)

**This document explains the technical building blocks of WorkNest in simple terms.**

It is written for non-technical stakeholders, so each section focuses on:

- what the technology is,
- why WorkNest uses it,
- and how it appears in the real project code.

---

## 1) Language Basics (JavaScript)

### Variables (`const`, `let`)
Variables are like labeled containers or boxes that store information we need to use later. We use `const` for information that doesn't change and `let` for information that might.

- `const` = a box that should not be reassigned.
- `let` = a box that can change.

**Example from `src/pages/auth/Login.jsx`:**
```javascript
const navigate = useNavigate();
```
*Here, we are creating a container named `navigate` that holds a tool to help us move between different pages of the app.*

**Why we use this:** It keeps data organized (for example, a user token, app settings, or form values).

**WorkNest example:**
```js
const queryClient = new QueryClient();
const [user, setUser] = useState(null);
```
- The first line creates one shared helper for server data.
- The second line creates a "user" value that can change over time.

(Seen in `src/App.jsx` and `src/store/AuthProvider.jsx`.)

### Functions
A function is a reusable action.

**Why we use this:** Instead of repeating steps everywhere, we write the steps once.

**WorkNest example:**
```js
export const loginUser = async (formData) => {
  return await axiosInstance.post("/auth/login", formData);
};
```
This function sends login details to the backend and returns the server response.

(Seen in `src/api/api.js`.)

### Arrow Functions (`=>`)
Arrow functions are a modern, shorter way to write instructions (functions) in JavaScript. They use the `=>` symbol, which looks like an arrow.

**Example from `src/api/api.js`:**
```javascript
export const loginUser = async (formData) => {
  return await axiosInstance.post("/auth/login", formData);
};
```
*This is an arrow function named `loginUser`. When called, it takes the user's login information (`formData`) and sends it to our server.*

**Why we use this:** Cleaner code and easier to read in React components.

**WorkNest example:**
```js
const handleChange = (e) => {
  setFormData((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};
```
This updates exactly one input field in the contact form while keeping the other fields unchanged.

(Seen in `src/pages/ContactUs.jsx`.)

### Objects and Arrays
- **Object** = a set of named fields (like a contact card).
- **Array** = a list of items.

**Why we use this:** Most app data (users, jobs, settings) naturally fits these structures.

**WorkNest example:**
```js
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  subject: "",
  message: "",
});
```
This object stores all values in the contact form.

(Seen in `src/pages/ContactUs.jsx`.)

### Async/Await and Promises
Sometimes code takes time to finish (like asking a server for data). "Promises" are like IOUs ("IOU" = "I Owe You") or a placeholder for that data. `async` and `await` are keywords that tell the computer to wait for that "promise" to be fulfilled before moving on, making the code easier to read.
These are ways to handle tasks that take time (like calling an API).

**Why we use this:** WorkNest talks to a server often. Async code lets the app stay responsive while waiting.

**WorkNest example:**
```js
const handleSubmit = async (e) => {
  e.preventDefault();
  await emailjs.send(...);
};
```
This waits for an email request to finish before showing success/failure feedback.

(Seen in `src/pages/ContactUs.jsx`.)


**Example from `src/api/api.js`:**
```javascript
export const loginUser = async (formData) => {
  return await axiosInstance.post("/auth/login", formData);
};
```
*The `async` keyword tells us this function handles a task that takes time. `await` tells the function to wait until the server responds with the login result before finishing.*



### Modules (`import` / `export`)
Modules split code into many files and share only what is needed.

**Why we use this:** Better organization and easier teamwork.

**WorkNest example:**
```js
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./store/AuthProvider";
```
The app imports routing and login state logic from separate files.

(Seen in `src/App.jsx`.)

---

## 2) Frontend Technologies (What users see)

### React
React is the UI framework WorkNest uses to build screens from reusable components.

**Why we use this:** It helps us build large interfaces in manageable pieces.

**WorkNest example:**
```jsx
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```
This starts the React app in the browser.

(Seen in `src/main.jsx`.)

### React Router
React Router controls page navigation in a single-page app.

**Why we use this:** Users can move between pages (Home, Jobs, Login, Admin) without full page reloads.

**WorkNest example:**
```jsx
const router = createBrowserRouter(routes);
return <RouterProvider router={router} />;
```
This creates and activates the full route map for the app.

(Seen in `src/routes/AppRoutes.jsx`.)

### Protected Routes (Access Control in UI)
Protected routes block users from pages they should not access.

**Why we use this:** Only logged-in users can access private pages, and only admins can access admin pages.

**WorkNest example:**
```jsx
if (!accessToken && location.pathname !== loginPath) {
  navigate(loginPath, { state: { from: location }, replace: true });
}
```
If a user is not logged in, they are redirected to login.

(Seen in `src/routes/ProtectedRoutes.jsx`.)

### React Query (`@tanstack/react-query`)
React Query handles server data fetching, caching, and refresh behavior.

**Why we use this:** It reduces manual loading/error/caching code and keeps data fresh.

**WorkNest example:**
```jsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
</QueryClientProvider>
```
This makes React Query available across the app.

(Seen in `src/App.jsx`.)

### React Hook Form + Zod (Form Handling + Validation)
- **React Hook Form** manages form state. Hooks are special tools in React that let us "hook into" features like keeping track of information (state) within a component.
- **Zod** defines validation rules (for example, password must be strong).

**Why we use this:** Users get immediate, clear form feedback before bad data is sent.

**Example from `src/pages/auth/Login.jsx`:**
```javascript
const [error, setError] = useState(null);
```
*We use `useState` to keep track of any error messages. If a login fails, we use `setError` to update the message, and React automatically shows it on the screen.*

**WorkNest example:**
```js
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(validatedSignUpSchema),
});
```
This connects the signup form to strict validation rules.

(Seen in `src/pages/auth/Signup.jsx` and `src/utils/dataSchema.js`.)

### Tailwind CSS
Tailwind is a utility-first styling framework.

**Why we use this:** Faster styling directly in component markup, with consistent spacing/colors.

**WorkNest example:**
```jsx
<button className="my-4 py-2 px-4 rounded bg-orange-500 hover:bg-orange-700 text-white">
  Go back
</button>
```
Short utility classes describe spacing, color, and hover behavior.

(Seen in `src/components/ErrorBoundary.jsx`.)

### Sonner (Toast Notifications)
Sonner shows small popup messages.

**Why we use this:** Users get quick feedback like "login successful" or "message sent".

**WorkNest example:**
```jsx
<Toaster position="top-right" richColors />
```
This enables notification popups globally.

(Seen in `src/App.jsx`.)

### Axios
Axios is an HTTP client for making API requests.

**Why we use this:** WorkNest frontend talks to backend endpoints for login, jobs, profile, etc.

**WorkNest example:**
```js
const axiosInstance = axios.create({
  baseURL: BASEURL + "/api/v1",
  withCredentials: true,
});
```
This creates one shared API client configured for WorkNest.

(Seen in `src/utils/axiosInstance.js`.)

### EmailJS
EmailJS sends emails from the frontend contact form.

**Why we use this:** Enables contact messages without building a custom frontend email transport flow.

**WorkNest example:**
```js
await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  { fullName: formData.fullName, email: formData.email, subject: formData.subject, message: formData.message },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
);
```
This sends contact form details through EmailJS.

(Seen in `src/pages/ContactUs.jsx`.)

---

## 3) Backend Technologies (Server side)

### Node.js + Express
Express is the web framework running the backend APIs.

**Why we use this:** It gives a simple way to define API endpoints and middleware.

**WorkNest example:**
```js
const app = express();
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
```
This starts an Express app and mounts auth and jobs routes.

(Seen in `backend codebase/index.js`.)

### REST API Structure
A REST API uses clear URL endpoints for operations (create/read/update/delete).

**Why we use this:** Predictable communication between frontend and backend.

**WorkNest example:**
```js
router.post("/create", validateFormData(validateSignUpSchema), register);
router.post("/login", rateLimiter, validateFormData(validateSignInSchema), login);
router.get("/user", verifyAuth, cacheMiddleware("auth_user", 3600), authenticateUser);
```
These routes handle signup, login, and profile fetch.

(Seen in `backend codebase/src/routes/userRoutes.js`.)

### Middleware
Middleware are like gatekeepers or checkpoint. They are functions that run before a request reaches its final destination to check things like "is this user logged in?" or "is the data they sent valid?"

**Why we use this:** Reusable security and validation checks.

**WorkNest examples:**
- `verifyAuth` checks JWT tokens.
- `validateFormData` checks request body format.
- `rateLimiter` reduces request abuse.

```js
router.post("/login", rateLimiter, validateFormData(validateSignInSchema), login);
```
Login requests go through anti-spam and validation checks first.

(Seen in `backend codebase/src/routes/userRoutes.js`.)

### JWT Authentication (Access + Refresh Tokens)
JWT tokens prove who the user is.

- **Access token:** short-lived token used on normal API calls.
- **Refresh token:** longer token stored in secure cookie to get a new access token.

**Why we use this:** Secure login sessions without storing session data on every request.

**WorkNest example:**
```js
const { accessToken, refreshToken, cookieOptions } = createSendToken(user);
res.cookie("userRefreshToken", refreshToken, cookieOptions);
return successResponse(res, { accessToken }, "Login successful", 200);
```
On login, backend returns access token and stores refresh token as cookie.

(Seen in `backend codebase/src/controllers/auth.controller.js`.)

### Password Hashing (`bcryptjs`)
Passwords are transformed into unreadable hashes before storage.

**Why we use this:** Even if data is leaked, plain passwords are not exposed.

**How used in WorkNest:** `bcryptjs` is included in backend dependencies for secure password handling.

(Declared in `backend codebase/package.json`.)

### Security Hardening (`helmet`, `cors`, `cookie-parser`, `compression`)
These tools make the API safer and faster.

- `helmet` adds secure HTTP headers.
- `cors` controls which websites can call the API.
- `cookie-parser` reads cookies.
- `compression` shrinks response size for speed.

**WorkNest example:**
```js
app.use(cors({ origin: allowOrigins, credentials: true }));
app.use(cookieParser());
app.use(helmet(helmetOptions));
app.use(compression(compressionOptions));
```
This configures core security and performance middleware.

(Seen in `backend codebase/index.js`.)

### Error Handling Pattern (`tryCatchFn`)
A wrapper that catches async errors and forwards them to one central error handler.

**Why we use this:** Cleaner controllers and consistent error responses.

**WorkNest example:**
```js
const tryCatchFn = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```
This avoids repeating try/catch in every endpoint.

(Seen in `backend codebase/src/lib/tryCatchFn.js`.)

---

## 4) Data Storage

### MongoDB + Mongoose
WorkNest uses MongoDB database with Mongoose models.

- **MongoDB** stores data as flexible documents.
- **Mongoose** defines structure and rules for those documents.

**Why we use this:** Flexible for changing data needs (jobs, users, applications).

**WorkNest example:**
```js
const userSchema = new Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["applicant", "admin"], default: "applicant" },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Jobs" }],
}, { timestamps: true });
```
This defines the shape of user records and includes saved jobs.

(Seen in `backend codebase/src/models/user.js`.)

### Database Connection Management
WorkNest has retry logic and connection event handling.

**Why we use this:** Better resilience if database connection drops.

**WorkNest example:**
```js
const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
mongoose.connection.on("disconnected", () => {
  setTimeout(connectToDB, 5000);
});
```
If disconnected, the backend attempts to reconnect automatically.

(Seen in `backend codebase/src/config/db.server.js`.)

---

## 5) Communication & App Behavior

### Frontend-to-Backend API Calls
The frontend uses Axios helper functions to call backend endpoints.

**Why we use this:** Keeps API calls consistent and reusable.

**WorkNest example:**
```js
export const getAllJobs = async (params = {}, accessToken) => {
  const config = { params };
  if (accessToken) {
    config.headers = { Authorization: `Bearer ${accessToken}` };
  }
  return await axiosInstance.get("/jobs/all", config);
};
```
This fetches jobs and sends token if available.

(Seen in `src/api/api.js`.)

### Caching (`node-cache`)
Caching stores recent responses temporarily in memory.

**Why we use this:** Faster repeated requests and less database load.

**WorkNest example:**
```js
const cachedData = cache.get(cacheKey);
if (cachedData) {
  return res.json(cachedData);
}
```
If data is already cached, backend returns it immediately.

(Seen in `backend codebase/src/middleware/cache.js`.)

### Rate Limiting
Rate limiting limits repeated requests in a short time window.

**Why we use this:** Helps prevent spam and brute-force login attempts.

**WorkNest example:**
```js
export const rateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later",
});
```
This allows only a limited number of requests within 2 minutes.

(Seen in `backend codebase/src/middleware/rateLimit.js`.)

### Search and Filtering Logic
WorkNest backend builds a dynamic filter object for job search.

**Why we use this:** Users can search by keyword, category, job type, and salary.

**WorkNest example:**
```js
if (keyword) {
  filter.$or = [
    { title: { $regex: keyword, $options: "i" } },
    { location: { $regex: keyword, $options: "i" } },
  ];
}
```
This performs case-insensitive text search across multiple fields.

(Seen in `backend codebase/src/services/job.service.js`.)

---

## 6) Development Tools

### Vite
Vite is the frontend build and dev server tool.

**Why we use this:** Very fast startup and hot reload during development.

**WorkNest example:**
```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```
This config enables React, Tailwind, and shortcut imports like `@/components/...`.

(Seen in `vite.config.js`.)

### ESLint
ESLint checks code quality rules automatically.

**Why we use this:** Catches common mistakes early and keeps style consistent.

**WorkNest example:**
```js
rules: {
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
},
```
This flags unused variables so the team can keep code clean.

(Seen in `eslint.config.js`.)

### Vitest
Vitest is the configured test runner on the frontend side.

**Why we use this:** Provides a standard way to execute tests.

**How used in WorkNest:** Test scripts exist in `package.json` (`test`, `test:watch`).

(Declared in `package.json`.)

### Nodemon
Nodemon restarts backend server automatically when files change.

**Why we use this:** Faster backend development loop.

**How used in WorkNest:** Backend `dev` script runs `nodemon index.js`.

(Declared in `backend codebase/package.json`.)

---

## 7) Architecture in Plain English

WorkNest is built as **two connected applications**:

1. **Frontend (React app):**
   - Shows pages,
   - handles forms,
   - manages login state,
   - and calls APIs.

2. **Backend (Express API):**
   - validates requests,
   - authenticates users,
   - reads/writes MongoDB data,
   - and returns responses.

These two parts communicate over HTTP using JSON data.

---

## 8) How All Pieces Fit Together (End-to-End Example)

When a user logs in:

1. User submits form in React.
2. Frontend validates inputs (React Hook Form + Zod).
3. Frontend sends request with Axios to `/api/v1/auth/login`.
4. Backend validates request (middleware + Zod).
5. Backend checks credentials and issues JWT tokens.
6. Frontend stores access token and updates auth state.
7. Protected routes now allow access to private pages.

So in simple terms:

- **React + Router** = screens and navigation,
- **Axios + React Query** = data communication and caching,
- **Express + middleware** = secure business logic,
- **MongoDB + Mongoose** = saved data,
- **JWT + cookies** = secure login sessions,
- **Tooling (Vite/ESLint/etc.)** = faster, cleaner development.

Together, these technologies power the full WorkNest experience for job seekers and administrators.
