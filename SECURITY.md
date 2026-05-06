# Security policy

## Reporting a vulnerability

If you find a security issue in Stride, email
**chaitanyakumar192@gmail.com** with a description and, if possible, a
proof-of-concept. I will acknowledge within two business days.

Do not open a public GitHub issue for security reports.

## What is in scope

- The Stride backend (`backend/`) and the React SPA (`web/`).
- The Railway deploy configuration in `nixpacks.toml` and `railway.json`.

Out of scope: third-party dependencies (please report upstream first), and
attacks that require physical access to the deploy host.

## Supported versions

This is the project's first release. Any security fix will land on `main`
and a new patch release.

## Hardening summary

- Passwords are hashed with **Argon2id** (memory-cost 19 MiB, time-cost 2,
  parallelism 1).
- Auth is delivered as a **JWT** in an `httpOnly`, `Secure`, `SameSite=Lax`
  cookie. A Bearer-token fallback exists for API clients.
- Helmet sets baseline response headers; CSP is intentionally not enabled
  (the SPA uses inline styles via Tailwind in dev) — apply your own CSP at
  the edge if you front Stride with a reverse proxy.
- `express-rate-limit` is applied globally and a stricter limiter is applied
  to auth routes.
- Pino is configured to redact `Authorization`, `Cookie`, and any
  `password*` fields.
- Zod validates every API boundary; database access is via Prisma's
  parameterised queries — no string interpolation reaches the database.
- The error handler hides unhandled errors behind a 500 with a `requestId`
  for correlation; it never returns stack traces to clients.
