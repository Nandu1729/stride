# Submission packet

Ethara AI — Full-Stack Assessment, Round 1.

## Form fields

| Field                         | Value                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| Live application URL          | _your Railway domain — see `docs/DEPLOY.md`_                       |
| GitHub repository link        | https://github.com/Nandu1729/stride                                |
| README file                   | `README.txt` at the repository root (mirrors `README.md`)          |
| Demo video                    | _2–5 minute walkthrough recorded against the live URL; see `docs/DEMO.md`_ |
| Updated resume                | `submission/Resume_Chaitanya_Kumar_Ethara.md` (export to PDF)      |

## Pre-submission checklist

```bash
npm run submit:check
```

Runs: required-files presence, README "Live URL" mention, backend typecheck,
web typecheck, backend tests, web build.

The check passes locally before every push.

## Demo account (seeded)

```
email:    demo@stride.app
password: DemoPass123!
```

Run `npm --workspace backend run db:seed` once after the first deploy.

## Mapping back to the brief

| Brief requirement                                                  | Where it lives                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Authentication (signup / login)                                    | `backend/src/services/auth.service.ts`, `web/src/auth/*`         |
| Project & team management                                          | `projects.service.ts`, `web/src/pages/Project*.tsx`              |
| Task creation, assignment & status tracking                        | `tasks.service.ts`, `web/src/pages/ProjectBoardPage.tsx`         |
| Dashboard (tasks, status, overdue)                                 | `dashboard.service.ts`, `web/src/pages/ProjectOverviewPage.tsx`  |
| REST APIs + database (SQL)                                         | Express + Prisma + PostgreSQL                                    |
| Proper validations & relationships                                 | Zod schemas + Prisma relations                                   |
| Role-based access control                                          | `requireRole` middleware + service-level RBAC checks             |
| Deployment using Railway, app must be live                         | `nixpacks.toml`, `railway.json`, `docs/DEPLOY.md`                |
