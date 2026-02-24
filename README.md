# EnvHopper

Env Hopper allow to keep a list of parameterized bookmarks for browser and it aimed to ease the work of QAs when they need to switch from one webapp to another or to switch between environments.

# Stage of project

As of 2026-Feb project is currently in development, not ready to be used on production.

## Local development

### Quick Start

To start both backend and frontend with hot reload:

```bash
pnpm run -w dev
```

This command will:

- Start the backend server on `http://localhost:4001`
- Start the frontend dev server on `http://localhost:4000`
- Watch for changes in both projects (no restart needed)
- Run both servers in parallel

Navigate to `http://localhost:4000` to view the application.

### Manual Setup (if needed)

```
npm install
npx nx run backend:generate
npx nx run backend:serve
npx nx run frontend:serve
```

Navigate to `http://localhost:4001`

### Migration

Change schema in `schema.prisma` and then run

```bash
cd apps/backend
prisma generate
npx prisma migrate dev
```
