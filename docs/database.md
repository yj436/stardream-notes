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
npm run dev:server
```

`db:seed` is idempotent: it upserts the built-in demo users and posts instead of clearing real data.

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
