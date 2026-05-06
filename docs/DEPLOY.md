# Deploying Stride to Railway

Stride deploys as a single Railway web service plus a managed Postgres plugin.
The Express process serves both the JSON API and the built React SPA, so
there is one URL for the user and one log stream to grep.

## Prerequisites

- A Railway account (https://railway.app).
- This repository pushed to GitHub on `Nandu1729/stride`.

## One-time setup

1. **Create a project**
   - Open Railway → New Project → "Deploy from GitHub repo" → choose
     `Nandu1729/stride`.
   - Railway detects `nixpacks.toml` and creates a web service.

2. **Add Postgres**
   - In the same project: New → Database → PostgreSQL.
   - Railway sets the `DATABASE_URL` variable on the web service automatically
     (use the "Variables" tab on the web service to confirm it is wired).

3. **Set environment variables on the web service**
   - `JWT_SECRET` — generate a long random string (32+ characters):
     ```bash
     openssl rand -hex 32
     ```
   - `JWT_EXPIRES_IN` — `7d` (default) or your preference.
   - `CORS_ORIGIN` — `https://<your-railway-domain>` once you know it. For
     the first deploy, use the placeholder Railway domain shown in the
     "Settings" → "Domain" panel.
   - `COOKIE_SECURE` — `true`. Production uses HTTPS, so the `stride_token`
     cookie should be marked secure.
   - `NODE_ENV` — `production` (Nixpacks sets this for you, but it is fine
     to be explicit).

4. **Generate a public domain**
   - Web service → Settings → Networking → "Generate Domain". You will get
     something like `https://stride-production-1234.up.railway.app`.
   - Update `CORS_ORIGIN` to match it, then redeploy.

## What happens on every deploy

`nixpacks.toml` defines:

- **install** — `npm ci` at the workspace root.
- **build** — `prisma generate` against `backend/prisma/schema.prisma`,
  `npm run build` (compiles backend and web), and finally
  `cp -R web/dist backend/dist/web` so the SPA travels alongside the compiled
  backend.
- **start** — `prisma migrate deploy` runs all pending migrations against
  the Railway Postgres, and then `WEB_DIST_DIR=backend/dist/web node
  backend/dist/index.js` boots Express.

`/api/healthz` is the configured health check. Railway will not consider the
deploy healthy until that endpoint returns 200.

## Seeding demo data

The `db:seed` script is idempotent — it upserts the demo users and replaces
the demo project. Run it once after the first deploy:

```bash
# from your machine, with Railway CLI installed and linked to the project
railway run --service stride "npm --workspace backend run db:seed"
```

After it finishes:

- email: `demo@stride.app`
- password: `DemoPass123!`

You can also override the password by setting `SEED_PASSWORD` before running
the seed.

## Verifying a deploy by hand

```bash
curl https://<your-domain>/api/healthz
# { "status": "ok", "uptime": 12.3 }

curl https://<your-domain>/api/readyz
# { "status": "ready" }

# Sign up:
curl -X POST https://<your-domain>/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"name":"You","email":"you@team.app","password":"AGoodPassword!"}'
```

Open the domain in a browser; you should land on the marketing page, sign
up from there, and end up on `/projects`.

## Troubleshooting

- **Migrations fail on first deploy** — confirm `DATABASE_URL` is set on the
  web service (check the "Variables" tab; it is added automatically when the
  Postgres plugin is attached, but only after both services exist).
- **Health check times out** — the migration step runs before the listen, so
  on the very first deploy the boot may take 5–10 seconds. Increase
  `healthcheckTimeout` if your migration set ever grows large.
- **CORS errors in the browser** — the SPA is served from the same origin as
  the API, so `CORS_ORIGIN` only matters if you also serve the SPA elsewhere.
  Set it to your Railway domain.
- **Cookies not set** — ensure `COOKIE_SECURE=true` *and* the domain is
  HTTPS. Browsers reject `Secure` cookies on plain HTTP.
