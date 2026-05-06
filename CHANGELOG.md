# Changelog

All notable changes to this project are recorded here. The format is loosely
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version
numbers follow Semantic Versioning.

## [0.1.0] — 2026-05-07

Initial release for the Ethara AI Round 1 assessment.

### Added
- Authentication: signup, login, logout, `/me`. Argon2id password hashing.
  JWT delivered in an `httpOnly` cookie and as a Bearer token.
- Projects: CRUD with creator-as-admin, member listing, invite by email,
  role change, member removal, owner protection.
- Tasks: list/create/update/delete, status and position per column,
  comments per task, assignment validated against project membership.
- Dashboard: counts by status, due-this-week, overdue list, recently
  updated tasks, top assignees, completion percentage.
- React SPA with kanban board (HTML5 drag-and-drop, optimistic status
  updates), task detail with inline edit, members tab, settings tab,
  landing page, login, signup, 404.
- Tests: Argon2, JWT, Zod schemas, env loader, error handler shape, health
  endpoints, auth service, project service (incl. owner protection), task
  service (RBAC matrix).
- Railway deploy configuration: single web service, `prisma migrate deploy`
  on every start, SPA served by the same Express process.
