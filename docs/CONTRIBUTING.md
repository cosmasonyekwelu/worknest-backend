# Contributing to WorkNest Backend

This document defines **how backend engineers are expected to work** on the WorkNest backend. It is opinionated by design and exists to keep the system stable, predictable, and safe as the team scales.

Frontend workflows are intentionally excluded.

---

## 1. Branching Strategy

### Default Branches
- `main` – always production-ready
- `dev` – integration branch for completed backend work

### Feature & Fix Branches
All work must be done in short-lived branches created from `dev`.

**Naming convention:**
```
feat/<scope>-<short-description>
fix/<scope>-<short-description>
chore/<scope>-<short-description>
refactor/<scope>-<short-description>
```

**Examples:**
```
feat/auth-refresh-tokens
fix/applications-status-transition
refactor/job-query-optimization
```

Never commit directly to `main` or `dev`.

---

## 2. Commit Message Format (Required)

We use **Conventional Commits**. This is not optional.

```
<type>(<scope>): <short summary>

[optional body]
```

### Allowed Types
- feat
- fix
- refactor
- chore
- docs
- test
- perf
- security

**Examples:**
```
feat(applications): add status transition validation
fix(auth): prevent refresh token reuse
security(users): hash passwords with bcrypt
```

This enables automated changelogs and clean release notes.

---

## 3. When to Create Branches

- Create a **feature branch** for any new endpoint, model, or behavior
- Create a **fix branch** for any bug affecting data integrity, security, or API behavior
- Create a **refactor branch** only when behavior does not change
- Hotfixes must still follow the same rules

If the change affects API contracts or data models, **it must go through a PR**, no exceptions.

---

## 4. Pull Request Rules

All PRs must target `dev`.

### Required PR Description
- What changed
- Why it changed
- Any API or data model impact
- Migration or backward-compatibility notes (if any)

---

### Backend PR Review Checklist (Mandatory)

Reviewers will block PRs that fail any of the following:

#### API & Contracts
- No breaking changes without versioning or approval
- Response formats are consistent
- Errors follow the standard error shape

#### Data Safety
- Migrations are backward-safe
- No destructive schema changes without migration strategy
- Index changes reviewed for performance impact

#### Error Handling & Logging
- Errors are caught and mapped to correct HTTP codes
- Logs are meaningful (no console noise)
- Sensitive data is never logged

#### Security
- Input is validated and sanitized
- Authz checks exist for every protected resource
- Secrets are never committed

#### Performance
- Queries are bounded and paginated
- No N+1 query patterns
- Heavy work is not done synchronously in request cycle

---

## 5. Required Tests Before Merge

Minimum requirement:
- Unit tests for business rules
- Integration tests for new endpoints
- Tests for any bug fix

Run before pushing:
```bash
npm test
```

PRs without tests will be rejected unless explicitly approved.

---

## 6. How Frontend Developers Should Ask Backend Questions

To get fast, accurate answers:

- Share the **exact endpoint** and HTTP method
- Include request payload and headers
- Include error response (if any)
- State whether this is blocking UI work

Good questions get faster answers. 

---

## Final Rule

If you are unsure about a change that touches **auth, data models, or public APIs**, ask before coding. Fixing broken contracts is more expensive than writing code 