# Arra Chaitanya Kumar

Hyderabad, Telangana, India · +91 99663 92966 · chaitanyakumar192@gmail.com
GitHub: github.com/Nandu1729 · Open to: Generalist LLM post-training, Bengaluru / Hyderabad / Remote

---

## Profile

Computer Science engineer with a structured-thinking habit and full-stack
fundamentals. I build small, well-scoped systems end-to-end — schema, REST API,
React UI, tests, deploy — and I care about the quiet things that make a project
trustworthy: validation at every boundary, role-based access enforced server-side,
and an error contract that does not lie to the client. Looking for a generalist
LLM post-training role where I can apply that discipline to RLHF, SFT, and
evaluation work.

## Skills

- **Languages**: TypeScript, JavaScript, Python, Java, C, C++, SQL.
- **Backend**: Node.js, Express, Prisma, PostgreSQL, MySQL, Zod, JWT, Argon2id,
  REST API design, RBAC, rate limiting, Pino-based structured logging.
- **Frontend**: React 18, Vite, TanStack Query, React Router, Tailwind CSS,
  state and form patterns, accessibility-aware markup.
- **Testing & quality**: Vitest, supertest, ESLint, Prettier, TypeScript strict
  mode, schema-first validation, defensive request contracts.
- **Cloud & ops**: Railway, Nixpacks, GitHub Actions-style CI hygiene, Docker
  basics, Linux (Ubuntu, Kali), Git.
- **LLM-adjacent**: rubric design for prompt-response evaluation (accuracy,
  relevance, coherence), data-quality checks, label and category schemas,
  thinking out loud through ambiguous instructions, writing instructions that
  another reviewer can apply consistently.

## Education

**Mahatma Gandhi Institute of Technology, Gandipet, Hyderabad** — JNTUH
B.Tech, Computer Science Engineering · 2019–2023

**Narayana IIT Academy, Adibatla, Hyderabad** — Telangana Board
Intermediate (M.P.C.), 96.5% · 2017–2019

**SPR School** — Board of Secondary Education
SSC, 9.7 CGPA · 2016–2017

## Selected project

### Stride — Full-stack team task manager (May 2026)

A team task manager built end-to-end for the Ethara AI Round 1 brief.
Live at `<railway-url>` — code at `github.com/Nandu1729/stride`.

- **Backend** (Node.js + TypeScript + Express + Prisma + PostgreSQL):
  REST API for projects, members, tasks, comments, and a per-project dashboard.
  Argon2id password hashing; JWT in an `httpOnly` cookie with a Bearer fallback.
  Zod schemas at every API boundary; central error handler with stable
  `{ error: { code, message, details } }` payloads.
- **Role-based access control**: `requireRole` middleware backed by a
  `Membership` join table. Service-level invariants protect the project owner
  from being demoted or removed. Tasks may only be assigned to current members
  of the project.
- **Frontend** (React 18 + Vite + Tailwind + TanStack Query):
  three-column kanban board with HTML5 drag-and-drop and optimistic status
  updates, task detail with inline edits and comments, members tab with role
  changes, settings tab with rename/delete, dashboard with overdue,
  due-this-week, recent activity, and per-assignee workload bars.
- **Testing**: 60+ Vitest cases covering passwords, JWT, env loader, the Zod
  schemas, the central error handler, the auth service, the project service
  (including owner-protection edge cases), and the task service's RBAC matrix
  (admin / creator / assignee / member / non-member).
- **Deploy**: a single Railway web service. `nixpacks.toml` runs `npm ci`,
  `prisma generate`, `npm run build`, copies the SPA build into `backend/dist/web`,
  and starts Express with `WEB_DIST_DIR` set so the same process serves the
  API and the SPA. `prisma migrate deploy` runs on every start; `/api/healthz`
  is the configured health check.

### Earlier projects

- **Stock trading platform** — backend prototype with order placement and
  symbol search.
- **Hotel reservation system** — Java + MySQL CRUD with availability checks.
- **Student grade tracker** — Python + SQLite gradebook with simple analytics.
- **AI chatbot** — pattern-based assistant with intents and a small response
  database.

## Why this role at Ethara AI

The brief asks for someone who can apply structured thinking to data
annotation, prompt-response evaluation, and quality checks — the same
discipline I lean on when designing API contracts and writing rubric-style
test cases. I'm comfortable iterating with a Quality Reviewer's feedback,
keeping a tight loop on labels and categories, and writing instructions
clearly enough that another reviewer reaches the same answer. I want to take
that habit into post-training work on frontier models.

## Languages

English (fluent · written and spoken), Hindi (fluent), Telugu (native).

## Personal

Date of birth: 24-12-2001 · Indian citizen · Hyderabad-based · happy to relocate.
Available immediately.
