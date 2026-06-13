# Database Deployment

The production data path is:

```text
GitHub Pages frontend -> hosted Express API -> managed MySQL database
```

GitHub Pages only hosts static files. It cannot run the Express API or host a database, so the real online version needs an API host such as Render, Railway, Fly.io, a VPS, or any Node.js platform that can reach MySQL.

## Production Environment

Set these variables on the API host:

```bash
DATABASE_URL="mysql://stardream_user:strong_password@mysql-host:3306/stardream_notes"
API_PORT=3001
# Most cloud hosts set PORT automatically. If both are present, PORT wins.
# PORT=3001
AUTH_SECRET="replace-with-a-long-random-secret"
CORS_ORIGIN="https://yj436.github.io"
```

Set this GitHub repository variable for the Pages build:

```text
VITE_API_BASE_URL=https://your-api-host.example.com/api
```

If `VITE_API_BASE_URL` is empty, the GitHub Pages frontend keeps using local mock data for demo mode.

## First Deploy

Run these commands on the API host after installing dependencies:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:doctor
npm run start:api
```

`db:seed` is idempotent: it upserts the built-in demo users and posts instead of clearing real data.

## Node Host Settings

For a standard Node.js host, use:

```text
Install command: npm ci
Build command: npm run db:generate
Start command: npm run start:api
```

Run database setup once before opening traffic:

```bash
npm run db:setup
```

If the host supports release commands, use `npm run db:migrate && npm run db:seed && npm run db:doctor` as the release step.

## Docker

The repository includes a backend-focused `Dockerfile`.

```bash
docker build -t stardream-api .
docker run --env-file .env -p 3001:3001 stardream-api
```

The image generates Prisma Client during build with a non-secret placeholder `DATABASE_URL`. Always provide the real `DATABASE_URL`, `AUTH_SECRET`, and `CORS_ORIGIN` at runtime.

## Smoke Test

After deployment, run:

```bash
API_BASE_URL="https://your-api-host.example.com/api" npm run smoke:api
```

This checks `/health`, `/posts`, and `/users`, and fails if MySQL health is not OK.

## Upload Storage

Uploaded images are currently stored in the local `uploads/` directory. On platforms with ephemeral disks, attach a persistent volume or replace uploads with object storage before relying on user uploads in production.

## Health Check

After the API starts, check:

```text
https://your-api-host.example.com/api/health
```

Healthy response shape:

```json
{
  "ok": true,
  "name": "stardream-api",
  "database": {
    "ok": true,
    "provider": "mysql",
    "counts": {
      "users": 4,
      "posts": 5,
      "comments": 3,
      "reports": 0
    }
  }
}
```

## Local SQLite Fallback

The previous SQLite schema is preserved at `prisma/sqlite/schema.prisma` for local experiments:

```bash
npm run db:sqlite:generate
npm run db:sqlite:push
```

Use MySQL for the online version.
