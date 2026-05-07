# Stride

A team task manager for small teams. Create a project, invite teammates, work
through a three-column board, and watch what is overdue.

---

## What it does

- **Authentication** — sign up and log in with email and password. Sessions are
  carried over a JWT in an `httpOnly` cookie, with a Bearer-token fallback
  for clients that prefer headers.
- **Projects** — create a project, write a short description, see who you have
  invited and who invited you.
- **Members and roles** — every project has at least one **admin** (the owner)
  and zero or more **members**. Admins can rename or delete the project,
  invite or remove people, and change roles. Members can work the board.
- **Tasks** — title, description, status (`To do` / `In progress` / `Done`),
  priority (`Low` / `Medium` / `High`), assignee, and due date. Comments per
  task. Position is preserved per column.
- **Board** — three-column kanban with native HTML5 drag-and-drop, optimistic
  status updates, and filters by assignee, priority, search text, and an
  "overdue only" toggle.
- **Dashboard** — counts by status, due-this-week, overdue list, recently
  updated tasks, workload by assignee, and a completion bar.

## Why these choices

A handful of decisions worth calling out:

- **REST API + Postgres + Prisma**, not a Backend-as-a-Service. The project
  brief asked for "REST APIs + Database (SQL/NoSQL), proper validations and
  relationships, role-based access control" — Postgres with Prisma keeps the
  relationships explicit (Project → Membership → User; Project → Task →
  Assignee), and the schema is in a single readable file.
- **Argon2id** for passwords (memory-cost 19 MiB, time-cost 2). bcrypt is fine,
  but Argon2id is the OWASP first recommendation in 2026.
- **JWT in an httpOnly cookie** by default. Bearer tokens still work, so a
  Postman collection or a curl flow can authenticate without cookies.
- **Zod at every API boundary**. Validation errors are returned as a single,
  flattened payload with field-level details. The same Zod schemas double as
  TypeScript types on the server.
- **TanStack Query on the client.** All server state goes through it: caching
  is per-key, mutations invalidate exactly the queries they touch, and the
  board uses optimistic updates so a drop feels instant.
- **A single Railway service.** The Express server serves the built React
  bundle from `WEB_DIST_DIR` for any non-`/api` path. One deploy, one URL.
- **Tests for the things that matter.** Argon2 hashing, JWT sign/verify,
  Zod schemas, the error handler shape, the auth service, the project service
  (including owner-protection invariants), and the task service's RBAC matrix
  (admin / creator / assignee / member / non-member).

## Tech stack

- **Backend** — Node.js 20, TypeScript (strict), Express 4, Prisma 5,
  PostgreSQL, Zod, Argon2id, JSON Web Tokens, Pino, Helmet, express-rate-limit.
- **Web** — React 18, Vite 5, TypeScript (strict), TanStack Query 5,
  React Router 6, Tailwind CSS, axios, date-fns.
- **Tests** — Vitest, supertest.
- **Tooling** — npm workspaces, ESLint, Prettier, EditorConfig.
- **Deploy** — Railway (Nixpacks), single web service serving the SPA from the
  Express process.

## Repository layout

```
stride/
  backend/                  Express + Prisma API
    prisma/
      schema.prisma         Models (User, Project, Membership, Task, Comment)
      seed.ts               Idempotent demo seed
    src/
      config/env.ts         Zod-validated process env
      lib/                  prisma client, logger, errors, jwt, passwords
      middleware/           auth, rate-limit, request-id, validate, error-handler
      schemas/              auth, projects, tasks zod schemas
      services/             auth, projects, tasks, dashboard business logic
      routes/               health, auth, projects, tasks routers
      app.ts / index.ts     server bootstrap and entrypoint
    tests/                  vitest suites (60+ tests)
  web/
    src/
      auth/                 AuthProvider context + RequireAuth guard
      lib/                  axios api client, dates
      ui/                   primitives (Avatar, Badge, Modal, Spinner, Toast)
      layout/               AppShell, ProjectShell (tab navigation)
      pages/                Landing, Login, Signup, Projects,
                            ProjectOverview / Board / Members / Settings,
                            TaskPage, NotFound
  docs/
    ARCHITECTURE.md         How the app fits together
    API.md                  Endpoint reference
    DEPLOY.md               Railway deploy walkthrough
  scripts/submit-check.mjs  Pre-submission checks
  railway.json / nixpacks.toml / Procfile
```

## Run it locally

```bash
# 1. Clone the repo
git clone https://github.com/Nandu1729/stride
cd stride

# 2. Install dependencies (npm workspaces — one install at the root)
npm install

# 3. Copy and edit env (DATABASE_URL, JWT_SECRET)
cp .env.example backend/.env

# 4. Generate the Prisma client and apply migrations to your local Postgres
npm --workspace backend run db:generate
npm --workspace backend run db:migrate:dev

# 5. Optional: seed demo data (a project, 3 users, 7 tasks)
npm --workspace backend run db:seed

# 6. Run backend (port 4000) and web (port 5173) together
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to the
backend on port 4000.

## Test, typecheck, build

```bash
npm run typecheck     # tsc on backend and web
npm run test          # vitest backend + web
npm run build         # builds web, then compiles backend
npm run submit:check  # runs all of the above + required-files check
```

## Architecture

The full write-up is in `docs/ARCHITECTURE.md`. The short version:

- **Five models, one diagram.** A `User` owns `Project`s; `Membership`
  joins users to projects with a role; `Task`s belong to a project and
  optionally point at an assignee; `Comment`s belong to a task. Every
  cross-resource access is scoped through `Membership`.
- **Three layers in the backend.** Routes are thin (parse params, validate,
  call the service); services hold the business rules and RBAC; libraries
  are stateless utilities. Prisma is the only thing that talks to the
  database.
- **Optimistic UI.** The board moves a task immediately; if the request
  fails, the previous state is restored and a toast explains why.

## API surface

Full reference: `docs/API.md`. Highlights:

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`
- `GET /api/projects`, `POST /api/projects`, `GET /api/projects/:id`,
  `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- `GET/POST/PATCH/DELETE /api/projects/:id/members[/:userId]`
- `GET /api/projects/:id/dashboard`
- `GET/POST /api/projects/:id/tasks`,
  `GET/PATCH/DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/status`,
  `GET/POST /api/tasks/:id/comments`
- `GET /api/healthz`, `GET /api/readyz`

All errors come back as `{ error: { code, message, details? } }`.

## Deployment

Stride is built as a single web service on Railway. The full walkthrough is in
`docs/DEPLOY.md`; the short version:

1. Add a Postgres plugin to your Railway project; it sets `DATABASE_URL`.
2. Set `JWT_SECRET` (32+ random characters), `CORS_ORIGIN`, `COOKIE_SECURE=true`
3. Push the repo. Railway picks up `nixpacks.toml`, runs `prisma migrate deploy`
   on start, and serves the SPA from `backend/dist/web`.

## Submission

- **Live URL** — _replace once deployed (see `docs/DEPLOY.md`)._
- **GitHub repo** — https://github.com/Nandu1729/stride
- **README** — this file (`README.md`) and `README.txt` for the form upload.

