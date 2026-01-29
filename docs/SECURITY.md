# Security Policy (SECURITY.md)

This document defines **security policies, expectations, and procedures** for the WorkNest backend. It is maintained by the backend team and applies to all production and pre-production environments.

---

## 1. Reporting Security Issues

All security vulnerabilities must be reported **privately**.

**Do NOT open public issues or pull requests for security problems.**

### Report via:
- Email: **worknestnig@gmail.com** (preferred)
- Or direct message to a backend lead if internal

Reports should include:
- Description of the issue
- Steps to reproduce
- Potential impact
- Any proof-of-concept (if available)

---

## 2. Responsible Disclosure Timeline

We follow a standard responsible disclosure process:

- **Acknowledgement:** within 48 hours
- **Initial assessment:** within 5 business days
- **Fix or mitigation:** within 30 days for most issues
- **Public disclosure (if applicable):** after fix is deployed

Critical vulnerabilities may be patched immediately without prior notice.

---

## 3. Threat Model (Project-Relevant OWASP Top 10)

The following threats are considered **in-scope and actively mitigated**:

1. **Broken Authentication**
   - Mitigated via JWT access + refresh tokens, expiry, rotation

2. **Broken Access Control**
   - Role-based authorization enforced on every protected route

3. **Injection (NoSQL / Command / File)**
   - Input validation and sanitization on all write endpoints

4. **Security Misconfiguration**
   - Environment-based config, no secrets in repo

5. **Sensitive Data Exposure**
   - Password hashing, encrypted secrets, limited PII access

6. **Identification & Authentication Failures**
   - Token expiry, refresh rotation, forced re-auth on risk

7. **Software & Data Integrity Failures**
   - Controlled releases, protected branches, code review

8. **Logging & Monitoring Failures**
   - Security events logged and monitored

Other OWASP risks are reviewed continuously as features evolve.

---

## 4. Authentication & Session Strategy

- JWT-based stateless authentication
- Short-lived access tokens
- Long-lived refresh tokens with rotation
- Refresh tokens are stored securely and can be revoked
- Passwords are hashed using industry-standard algorithms (bcrypt/argon2)
- Email verification supported for account trust

Sessions are never stored server-side.

---

## 5. Authorization Model

- Role-based access control (RBAC)
  - USER
  - ADMIN

- Authorization enforced at:
  - Route level
  - Resource ownership level

Rules:
- Users can only access their own data
- Admin-only routes are explicitly protected
- No implicit trust between services or clients

---

## 6. Secrets Management

- Secrets are **never committed** to the repository
- All secrets are provided via environment variables
- Production secrets are stored in secure secret managers
- Secrets are rotated on:
  - Leak
  - Team member departure
  - Scheduled rotation window

Examples of protected secrets:
- JWT secrets
- Database credentials
- Cloudinary keys
- SMTP credentials

---

## 7. Data Classification & PII Handling

### Data Classes

**Public**
- Job listings
- Company names

**Internal**
- Application status
- Platform metrics

**Sensitive / PII**
- Email addresses
- Phone numbers
- Uploaded CVs
- Password hashes

### Rules
- PII is never logged
- PII is returned only to authorized users
- Uploaded documents are stored outside the database (Cloudinary)
- Database access is restricted by role

---

## 8. Rate Limiting & Abuse Prevention

- Public endpoints are rate-limited
- Auth endpoints have stricter limits
- Application submission endpoints are protected
- IP-based throttling applied at gateway level
- Abuse patterns trigger temporary blocks

Future additions may include CAPTCHA or device fingerprinting.

---

## 9. Logging & Security Monitoring

The backend logs the following security events:

- Failed login attempts
- Token refresh failures
- Access denied events
- Rate limit violations
- Suspicious request patterns
- Admin actions (job changes, status updates)

Logs are:
- Centralized
- Retained for audit
- Reviewed during incidents

Sensitive fields are always masked.

---

## 10. Enforcement

Any code that weakens authentication, authorization, or data protection will be rejected during review.

Security is a **release blocker**, not a follow-up task.
