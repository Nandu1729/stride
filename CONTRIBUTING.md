# Contributing

Stride is small on purpose. If you are reviewing this for the Ethara AI brief,
this file is here so you can verify the project is real, not because the
project expects external contributions.

## Local setup

```bash
git clone https://github.com/Nandu1729/stride
cd stride
npm install
cp .env.example backend/.env
# Edit DATABASE_URL and JWT_SECRET
npm --workspace backend run db:generate
npm --workspace backend run db:migrate:dev
npm --workspace backend run db:seed
npm run dev
```

## Quality gates

Before opening a PR (or before submission, in this case), run:

```bash
npm run typecheck   # backend + web
npm run test        # backend unit + service tests
npm run build       # backend + web compile
npm run submit:check
```

## Conventions

- TypeScript strict mode on both sides.
- Conventional-ish commit prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`,
  `test`, `db`, `deploy`. Keep the message in lowercase, sentence-case is
  fine after the colon.
- Imports use the `@/` alias for paths inside `src/`.
- Validators live in `backend/src/schemas`; routes only call services after
  validation has passed.
