# Security Architecture & Best Practices
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Organization:** FixoBoard  

---

### 1. Security Architecture Principles

1. **Defense in Depth:** Multi-tiered security at Network (Reverse Proxy), Application (FastAPI Middleware, Pydantic strict schemas), Domain (State Machine guards), and Database levels (Foreign keys, parameterized queries).
2. **Least Privilege RBAC:** Every endpoint enforces specific permission checks (`current_user.has_permission(...)`).
3. **Immutability of Audit Trails:** The `audit_logs` table records all mutations and cannot be modified or truncated by application users.
4. **Data Protection at Rest & in Transit:** TLS 1.3 encryption in transit; sensitive fields (passwords, tokens) hashed with Argon2id / BCrypt (Cost 12).

---

### 2. Threat Modeling & Mitigation Matrix (OWASP Top 10)

| Vulnerability Threat | Mitigation in FixoBoard MMS |
| :--- | :--- |
| **A01: Broken Access Control** | FastAPI dependency injection checks user permissions at route level. IDOR protection validates entity ownership and status prior to mutation. |
| **A02: Cryptographic Failures** | Strict Argon2/BCrypt password hashing with unique salt per user. Ephemeral JWT access tokens signed with HMAC-SHA256 (minimum 256-bit key). |
| **A03: Injection (SQL / NoSQL / Command)** | 100% parameter-bound queries via SQLAlchemy ORM 2.0. Pydantic v2 validates and sanitizes all incoming payloads. |
| **A04: Insecure Design** | Centralized domain state machine prevents illegal status bypasses (e.g. attempting to dispatch unapproved orders). |
| **A05: Security Misconfiguration** | Strict CORS policy restricting allowed origins. Debug modes disabled in production. Minimal Alpine Docker base images. |
| **A06: Vulnerable & Outdated Components** | Pinned dependencies with automated dependency scanning in CI pipeline. |
| **A07: Identification & Auth Failures** | Rate limiting on `/api/v1/auth/login` (5 attempts per minute per IP). Account lockout after consecutive failed attempts. |
| **A08: Software & Data Integrity Failures** | Uploaded files verified against strict MIME type whitelists (`application/pdf`, `image/png`, `image/jpeg`). File size capped at 10MB. Files stored with sanitized UUID keys. |
| **A09: Security Logging & Monitoring Failures** | Structured JSON logging with correlation IDs. Every commercial, production, and dispatch transaction logged in `audit_logs`. |
| **A10: Server-Side Request Forgery (SSRF)** | No arbitrary external URL fetching in application routes. |
