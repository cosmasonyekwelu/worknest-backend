# WorkNest Frontend Explanation

## 1. Project Overview

### What is WorkNest?
WorkNest is a job portal web app. It helps two main groups:
- **Applicants**: browse jobs, save jobs, apply for jobs, and track applications.
- **Admins/Recruiters**: create job posts, manage applications, and monitor hiring activity.

### Non-technical summary
Think of WorkNest as a digital hiring office:
- People looking for work can find openings and send their information.
- Companies can publish openings and review candidates from one dashboard.

---

## 2. Tech Stack

### Frontend technologies used
- **React 19**: builds the UI as reusable components.
- **Vite**: fast development server and build tool.
- **React Router**: handles URL-based page navigation.
- **TanStack React Query**: handles data fetching, caching, and loading states.
- **Axios**: HTTP client for backend API requests.
- **Tailwind CSS + DaisyUI**: utility-first styling + ready UI primitives.
- **React Hook Form + Zod**: form management and validation.
- **Sonner**: toast notifications.
- **Vitest**: configured test runner for frontend tests.

### Why this stack likely fits the team
- Popular and well-documented tools.
- Fast UI iteration (React + Vite + Tailwind).
- Cleaner API handling (Axios + React Query).
- Better form reliability (React Hook Form + Zod).

---

## 3. Project Structure

Top-level frontend structure:

- `src/main.jsx` → app entry point.
- `src/App.jsx` → wraps app with global providers.
- `src/routes/` → route definitions and route guards.
- `src/layouts/` → page shells (public, auth, admin).
- `src/pages/` → full page-level screens.
- `src/components/` → reusable UI components.
- `src/hooks/` → reusable custom logic for fetching/managing state.
- `src/api/` → API request functions.
- `src/store/` → auth context provider and hook.
- `src/utils/` / `src/constants/` → shared helpers and constants.
- `public/` → static images/icons.

This separation makes the project easier to maintain: pages focus on display, hooks focus on logic, and api files focus on HTTP calls.

---

## 4. Frontend Implementation

### A) Main app setup (global providers)

```jsx
// src/App.jsx
const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes/>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
```

What this does step-by-step:
1. Creates a React Query client.
2. Enables toast notifications globally.
3. Wraps the app in `QueryClientProvider` so every page can fetch/cache server data.
4. Wraps with `AuthProvider` to keep authentication state available everywhere. or  Wraps the app in an authentication context to track user login status.
5. Renders all routes with `AppRoutes`.

---

### B) Routing architecture (public, private, and admin)

```jsx
// src/routes/AppRoutes.jsx
const routes = [
  {
    path: "/auth",
    element: (
      <PublicRoutes accessToken={accessToken} user={user}>
        <Suspense fallback={<SuspenseUi />}>
          <AuthLayout />
        </Suspense>
      </PublicRoutes>
    ),
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "admin/login", element: <AdminLogin /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "jobs/:id", element: <PrivateRoutes {...privateRouteProps}><JobDetails /></PrivateRoutes> },
      { path: "apply/:id", element: <PrivateRoutes {...privateRouteProps}><CandidateApplicationForm /></PrivateRoutes> },
    ],
  },
  {
    path: "/admin",
    element: <PrivateRoutes {...privateRouteProps}><DashboardLayout /></PrivateRoutes>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "jobs", element: <AdminJobs /> },
      { path: "applications", element: <AdminApplications /> },
    ],
  },
];
```

Key idea:
- Routes are split by role/use case.
- `PublicRoutes` blocks logged-in users from auth pages.
- `PrivateRoutes` protects pages that need login.
- Heavy pages are lazy-loaded (`lazy` + `Suspense`) for faster initial load.

---

### C) Layout system

```jsx
// src/layouts/MainLayout.jsx
export default function MainLayouts() {
  return (
    <>
      <header>
        <div className="container">
          <Navbar />
        </div>
      </header>

      <main className="pt-25">
        <Outlet />
      </main>

      <footer>
        <div className="w-full">
          <Footer />
        </div>
      </footer>
    </>
  );
}
```

`Outlet` is where child pages render. This avoids repeating navbar/footer on every page component.

---

### D) API calls from frontend

```js
// src/utils/axiosInstance.js
const BASEURL = import.meta.env.VITE_WORKNEST_BASE_URL;

const config = {
  baseURL: BASEURL + "/api/v1",
  timeoutErrorMessage: "Waiting for too long...Aborted!",
  timeout: 30000,
  withCredentials: true,
};

const axiosInstance = axios.create(config);
```
**Explanation:**
- **baseURL**: Points to the backend API.
- **withCredentials**: Ensures that cookies (like session tokens) are sent with every request, enabling secure authentication.

```js
// src/api/api.js
export const loginUser = async (formData) => {
  return await axiosInstance.post("/auth/login", formData);
};

export const getAllJobs = async (params = {}, accessToken) => {
  const config = { params };
  if (accessToken) {
    config.headers = { Authorization: `Bearer ${accessToken}` };
  }
  return await axiosInstance.get("/jobs/all", config);
};
```

How it works:
1. One configured Axios client is reused everywhere.
2. Base URL is read from environment variables.
3. Credentials (cookies) are enabled for refresh-token flow.
4. Authorized requests attach `Bearer` token.

---

### E) State management (Auth Context + React Query)

```jsx
// src/store/AuthProvider.jsx
const [user, setUser] = useState(null);
const [accessToken, setAccessToken] = useState(() => {
  const token = localStorage.getItem("worknestToken");
  return token;
});

useQuery({
  queryKey: [isAdminPath ? "admin_profile" : "auth_user", accessToken],
  queryFn: async () => {
    const authRequest = isAdminPath
      ? getAuthenticatedAdmin(accessToken)
      : getAuthenticatedUser(accessToken);
    const res = await authRequest;
    if (res.status === 200) setUser(res.data.data);
    return res.data;
  },
  enabled: !!accessToken,
  retry: false,
});

useQuery({
  queryKey: ["refresh_token", isAdminPath],
  queryFn: async () => {
    const refresh = isAdminPath ? refreshAdminAccessToken : refreshAccessToken;
    const res = await refresh();
    const newToken = res?.data?.data?.accessToken;
    setAccessToken(newToken);
    return newToken;
  },
  enabled: !accessToken && !hasLoggedOut,
  retry: false,
  onError: logout,
});
```

Simple explanation:
- Auth state (`user`, `token`) is stored globally in context.
- If token exists, app fetches current user profile.
- If token is missing, it tries refreshing through cookie-based endpoint.
- On failure, user is logged out safely.

---

### F) Representative feature component (Job application form)

```jsx
// src/pages/CandidateApplicationForm.jsx (core submit logic)
const formData = new FormData();
formData.append("resume", cvFile);
if (portfolioUrl) formData.append("portfolioUrl", portfolioUrl);
if (linkedinUrl) formData.append("linkedinUrl", linkedinUrl);
formData.append("answers", JSON.stringify(answersArray));
formData.append("personalInfo", JSON.stringify(personalInfo));

applyMutation.mutate(formData);
```
**Explanation:**
1. **State Management**: It uses `useState` to manage form fields and `useAuth` to pre-fill user data.
2. **Mutation**: `useMutation` from React Query handles the asynchronous API call to submit the application.
3. **FormData**: Since the application includes a resume (file), it uses the `FormData` API to bundle the file and text data together.

This is a good example of real app behavior:
- Combines text + file upload in one request.
- Sends structured answers and personal info as JSON strings.
- Uses mutation pattern (React Query) to handle submit/loading/success/error.

---

## 5. Backend Interaction from Frontend (How request flow looks)

A normal protected flow:
1. User logs in on frontend (`/auth/login`).
2. Backend returns access token + refresh cookie.
3. Frontend stores token in context/localStorage.
4. AuthProvider fetches profile and keeps session active.
5. Feature pages call API helpers (jobs/applications/admin).
6. If access token expires, frontend requests refresh endpoint using cookie.

---

## 6. Database Awareness on Frontend

Frontend does not connect directly to the database.
It works with backend JSON responses that include:
- Users
- Jobs
- Applications

Frontend has normalization logic for uncertain response shapes. Example:

```js
// src/api/applications.js
export const normalizeApplication = (app) => {
  const jobInfo = app.jobId || app.job || {};
  // ... parse and normalize user/job fields
  return {
    id: app._id || app.id,
    status: app.status || "submitted",
    applicant: { /* normalized fields */ },
    job: { /* normalized fields */ },
  };
};
```

This helps the UI stay stable even when backend returns slightly different field shapes.

---

## 7. Key Frontend Features

### 1) Authentication UX
- Login, signup, forgot/reset password pages.
- Refresh-token flow for persistent sessions.
- Route guards for public/private/admin pages.

### 2) Job browsing and filtering
- Query-based job search.
- Pagination and multiple filters.
- UI-aware normalization in hooks (`useJobs`) to handle API metadata safely.

### 3) Job application flow
- Dynamic application questions.
- Resume upload support.
- Form data packaging for mixed file/text input.

### 4) Admin dashboard
- Job CRUD interface.
- Application overview/stat cards.
- Separate admin auth path and protected route tree.

---

## 8. Deployment & Configuration (Frontend)

Main config files:
- `package.json` → scripts and dependencies.
- `vite.config.js` → Vite setup.
- `vercel.json` → deployment rewrite rule for SPA routing.

`vercel.json` content:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Meaning: every route points to index page, so client-side routing can render the right React page.

Environment variables (from code usage):
- `VITE_WORKNEST_BASE_URL` → backend URL used by Axios.

---

## 9. Testing

Frontend has testing dependency setup (`vitest`) in `package.json`, but there are no actual test files in this repository snapshot.

So, this project is **test-ready** but currently appears to rely mostly on manual verification.

---

## 10. Conclusion

The frontend of WorkNest is built as a modern React SPA with clear separation between:
- UI components,
- page-level views,
- API communication,
- and authentication/session handling.

The team implemented both applicant and admin experiences in one codebase, with protected routing, reusable hooks, and file-upload application flow. This is a solid foundation for scaling the platform.
