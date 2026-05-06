# API reference

Base URL: `<host>/api`

All endpoints respond with JSON. Errors come back as
`{ "error": { "code": "...", "message": "...", "details"?: ... } }`.

Authentication accepts either:

- the `stride_token` httpOnly cookie set on signup/login, or
- an `Authorization: Bearer <jwt>` header.

The token contains `{ sub: <user-id>, email: <user-email> }` and is signed
with `JWT_SECRET`.

---

## Health

| Method | Path           | Description                                           |
| ------ | -------------- | ----------------------------------------------------- |
| GET    | `/healthz`     | Returns `{ status: "ok", uptime: <seconds> }`.        |
| GET    | `/readyz`      | Pings the database; returns 503 if it is unreachable. |

---

## Auth

### `POST /auth/signup`

```json
{ "name": "Aanya Mehta", "email": "aanya@stride.app", "password": "StrongPass1" }
```

`201 Created`

```json
{
  "user": { "id": "...", "name": "Aanya Mehta", "email": "aanya@stride.app", "createdAt": "..." },
  "token": "<jwt>"
}
```

The same token is set as an `httpOnly` cookie.

### `POST /auth/login`

```json
{ "email": "aanya@stride.app", "password": "StrongPass1" }
```

`200 OK` — same shape as signup. `401` if credentials are wrong.

### `POST /auth/logout`

`204 No Content`. Clears the cookie. The token will still be valid until it
expires; clients should drop their stored copy.

### `GET /auth/me`

`200 OK`

```json
{ "user": { "id": "...", "name": "...", "email": "..." } }
```

`401` if no token or the token has expired.

---

## Projects

### `GET /projects`

List the projects the caller is a member of.

```json
{
  "projects": [
    {
      "id": "...", "name": "...", "description": "...",
      "ownerId": "...", "role": "ADMIN" | "MEMBER",
      "createdAt": "...", "updatedAt": "...", "joinedAt": "...",
      "_count": { "tasks": 7, "members": 3 }
    }
  ]
}
```

### `POST /projects`

```json
{ "name": "Stride launch", "description": "Ship v1 to first 50 small teams." }
```

`201 Created` — returns the created project, with the caller assigned as
`ADMIN` automatically.

### `GET /projects/:id`

Returns the project with members and counts. Requires the caller to be a
member.

### `PATCH /projects/:id` (admin)

```json
{ "name": "...", "description": "..." | null }
```

### `DELETE /projects/:id` (admin)

`204 No Content`. Cascades to memberships, tasks, and comments.

### `GET /projects/:id/members` (member)

Returns the membership rows with their associated user.

### `POST /projects/:id/members` (admin)

```json
{ "email": "rohan@stride.app", "role": "MEMBER" }
```

`201 Created`. `404` if no Stride user owns that email; `409` if they are
already a member.

### `PATCH /projects/:id/members/:userId` (admin)

```json
{ "role": "ADMIN" | "MEMBER" }
```

`409` if the target is the project owner and `role !== "ADMIN"`.

### `DELETE /projects/:id/members/:userId` (admin)

`204 No Content`. `409` if the target is the project owner.

### `GET /projects/:id/dashboard` (member)

```json
{
  "dashboard": {
    "counts": { "total": 7, "todo": 4, "inProgress": 2, "done": 1, "overdue": 1, "dueThisWeek": 3 },
    "byPriority": { "low": 1, "medium": 4, "high": 2 },
    "completion": 14,
    "overdue": [ /* tasks */ ],
    "recent": [ /* tasks */ ],
    "topAssignees": [ { "user": { ... }, "count": 3 } ]
  }
}
```

---

## Tasks

### `GET /projects/:id/tasks?status=&priority=&assigneeId=&overdue=`

Lists tasks for the project, ordered by `(status, position, createdAt)`. Each
filter is optional. `overdue=true` keeps only un-DONE tasks with a `dueDate`
in the past.

### `POST /projects/:id/tasks`

```json
{
  "title": "...",
  "description": "...",
  "status": "TODO",       // optional, default TODO
  "priority": "MEDIUM",   // optional, default MEDIUM
  "dueDate": "2026-05-10T00:00:00.000Z" | null,
  "assigneeId": "<user-id>" | null
}
```

`201 Created`. The new task is appended at the end of its column (`position`
is the current max + 1).

### `GET /tasks/:id`

Returns the task plus its comments. Caller must be a member of the project
the task belongs to.

### `PATCH /tasks/:id`

Body is a partial update. Authorization is checked at the field level:

- An **admin** of the project may update any field.
- The **creator** of the task may update any field.
- The **assignee** may update any field.
- A regular member who is neither creator nor assignee gets `403`.

### `PATCH /tasks/:id/status`

Convenience endpoint for the kanban board:

```json
{ "status": "IN_PROGRESS", "position": 0 }
```

Same authorization as `PATCH /tasks/:id`.

### `DELETE /tasks/:id`

`204 No Content`. Authorized for the project admin or the task creator.

### `GET /tasks/:id/comments`

Returns the comments in chronological order, each with the author profile.

### `POST /tasks/:id/comments`

```json
{ "body": "Looks good — shipping after one more review." }
```

`201 Created`. Any project member can comment.

---

## Validation errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "formErrors": [],
      "fieldErrors": { "email": ["Valid email required"] }
    }
  }
}
```

## Common error codes

| Status | Code               | When                                     |
| ------ | ------------------ | ---------------------------------------- |
| 400    | `BAD_REQUEST`      | A precondition was missing.              |
| 400    | `VALIDATION_ERROR` | A Zod schema rejected the payload.       |
| 401    | `UNAUTHORIZED`     | No / invalid / expired token.            |
| 403    | `FORBIDDEN`        | The token is valid but not allowed.      |
| 404    | `NOT_FOUND`        | Route or resource does not exist.        |
| 409    | `CONFLICT`         | Duplicate or invariant violation.        |
| 429    | `TOO_MANY_REQUESTS`| Rate limit hit (auth or general).        |
| 500    | `INTERNAL`         | Unhandled error. `requestId` is included.|
