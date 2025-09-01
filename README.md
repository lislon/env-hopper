# EnvHopper

Env Hopper allow to keep a list of parameterized bookmarks for browser and it aimed to ease the work of QAs when they need to switch from one webapp to another or to switch between environments.

# Stage of project

As of 2024-May-27 project is currently in development, not ready to be used on production.

# Screenshot

![Env Hopper Demo](docs/env_hopper.gif)

## Local development

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
cd packages/v1-backend
prisma generate
npx prisma migrate dev
```
