# Architecture

This document explains how Stride fits together. It is short on purpose — the
codebase is small, and the intent is to make it easy to read end-to-end.

## High-level diagram

```
                +-----------------------------+
                |  Browser (React 18 + Vite)  |
                |   /, /login, /projects, …   |
                +--------------+--------------+
                               |
                               | fetch /api/* (cookie + bearer)
                               v
                +--------------+--------------+
                |  Express 4 (TypeScript)     |
                |  - helmet, cors, rate-limit |
                |  - request id, pino-http    |
                |  - error handler, 404       |
                +--------------+--------------+
                               |
                               v
        +----------+   +----------+   +----------+
        | Auth svc |   | Projects |   |  Tasks   |
        |          |   |  svc     |   |   svc    |
        +----+-----+   +----+-----+   +----+-----+
             |              |              |
             +------- Prisma client --------+
                            |
                            v
                  +---------+----------+
                  |   Postgres (Railway)|
                  +--------------------+
```

A single Railway service runs the backend. In production, `WEB_DIST_DIR` is
set to `backend/dist/web` so the same Express process serves the React SPA
for any non-`/api` path.

## Data model

Five tables. Foreign keys cascade where deleting a parent should remove
children (a deleted project removes its tasks, memberships, and comments).
Indexes back the queries we actually run (project members, tasks by status,
overdue scans).

```
User (id, email unique, name, passwordHash, createdAt, updatedAt)
  ↑                                                ↑
  | owns                                           | created /
  |                                                | assigned
  v                                                |
Project (id, name, description, ownerId, createdAt, updatedAt)
  | 1—N
  v
Membership (id, projectId, userId, role: ADMIN|MEMBER, joinedAt)
  // unique (projectId, userId) — a user can join a project once.
  // The owner always has a Membership row with role ADMIN.

Task (id, projectId, title, description, status, priority,
      dueDate?, position, createdById, assigneeId?, createdAt, updatedAt)
  | 1—N
  v
Comment (id, taskId, userId, body, createdAt)
```

`status` is `TODO | IN_PROGRESS | DONE`. `priority` is `LOW | MEDIUM | HIGH`.
Both are Postgres enums; Prisma generates matching string-literal types in
TypeScript, so the API and UI never disagree on the allowed values.

## Authentication

- Passwords are hashed with **Argon2id** (memory-cost 19 MiB, time-cost 2,
  parallelism 1). The hash is opaque to everything but `verifyPassword`.
- Successful signup or login returns a **JWT** in the response body and also
  sets it as an `httpOnly` cookie named `stride_token`. The frontend stores
  the same token in `localStorage` and sends it as a `Bearer` header on every
  request, so cookie-blocked clients (Postman, curl, mobile WebView) still
  work.
- `requireAuth` middleware accepts either source. It looks up the user once
  per request (cheap with the email index) so a deactivated user is rejected
  immediately.

## Authorization (RBAC)

Authorization rules live next to the routes that need them.

```
            view           create        edit         delete
project   (member)         (any user)   admin        admin
member    (member)         admin        admin        admin (not owner)
task      (member)         (member)     admin OR     admin OR
                                        creator OR   creator
                                        assignee
comment   (member)         (member)     —            —
```

Three small invariants keep the model honest:

1. The project owner always has an ADMIN membership row, created in the same
   transaction as the project itself (`projects.service#createProject`).
2. The owner cannot be demoted from ADMIN, and cannot be removed from the
   project. The membership service raises a 409 in both cases.
3. Tasks may only be assigned to a current member of the project. The task
   service validates this on create and on update.

## Validation

Every request body, query, and route param is validated with Zod. The shared
`validate.ts` middleware:

- replaces `req.body` with the parsed value, so types flow into the handler;
- attaches `req.validatedQuery` (instead of mutating `req.query`, which Express
  marks read-only);
- delegates to the central error handler, which flattens Zod errors into a
  predictable `{ error: { code: 'VALIDATION_ERROR', details } }` shape.

## Error contract

All endpoints respond with one of:

- `2xx` — success, with the resource(s) in the body.
- `4xx`/`5xx` — `{ error: { code, message, details?, requestId? } }`.

The codes are stable enough to switch on in clients. A 500 always returns a
`requestId` so the developer can grep for it in the Pino log.

## Logging and tracing

- Every request gets a ULID via `requestId` middleware. The id round-trips on
  the `x-request-id` response header and is included in all log lines through
  `pino-http`'s `customProps`.
- The Pino logger redacts `Authorization` and `Cookie` headers, plus any
  `password` or `passwordHash` fields, so credentials never leak into logs.
- Health checks are excluded from auto-logging to keep the signal-to-noise
  ratio high.

## Frontend architecture

- **Routing.** React Router with a top-level `RequireAuth` guard around the
  app shell. Project tabs (`Overview`, `Board`, `Members`, `Settings`)
  share a `ProjectShell` that loads the project once and provides it via
  context.
- **Server state.** TanStack Query holds all server state. Queries are keyed
  by entity (`['project', id]`, `['project-tasks', id]`, etc.) and mutations
  invalidate exactly what they touch.
- **Optimistic updates.** Drag-and-drop on the board updates the cached list
  before the network call. If the request fails, the previous list is
  restored and a toast surfaces the error.
- **Forms.** Plain controlled components with `useState`. The shapes are
  small enough that a form library would add weight without value.
- **Styling.** Tailwind with a small custom palette (ink, accent, moss, amber,
  rose) and a handful of component utility classes (`.btn`, `.card`, `.chip`).
  No additional UI library, so the bundle stays under 100 kB gzipped.

## Deploy shape

`nixpacks.toml` defines a single web service:

1. **install** — `npm ci` at the root (workspaces).
2. **build** — `prisma generate` against `schema.prisma`, then `npm run build`
   (which compiles the backend and the web), then `cp -R web/dist
   backend/dist/web` so the SPA travels with the backend's compiled output.
3. **start** — `prisma migrate deploy`, then `node backend/dist/index.js`
   with `WEB_DIST_DIR=backend/dist/web`. The Express process serves both the
   API and the SPA.

`/api/healthz` is the health check; Railway probes it on every deploy.

## What is intentionally out of scope

- Real-time updates (websockets / SSE). Tasks update through TanStack Query
  invalidation, which is enough for a small team and avoids the operational
  burden of sticky sessions on Railway's free tier.
- File uploads on tasks. The data model has room for it, but the UI does not
  ship it.
- Email delivery. Invites assume the invitee already has an account; the
  invite endpoint resolves by email and adds them as a member.
- A query language. Filters are intentionally a small fixed set (assignee,
  priority, search text, overdue-only) — enough to demo, narrow enough to
  stay snappy without indexing tricks.
