---
'@env-hopper/backend-core': minor
---

Add the deployment catalog: its schema and its read/write API.

- New Prisma models for Environments, Apps, Components, Deployment Targets,
  Releases, Artifacts, Deployments, Users, Endpoints and Health, in the core's
  migration history.
- `createCatalog()` returns a `Catalog`: `syncX(tx, scope, list)` writers in one
  `transaction`, and reads (`listDeployments`, `resolveAlias`,
  `getPairDeployments`, `getComponents`).
- `createEhMiddleware` takes an optional `catalog`, which the `pair` and
  `slices` queries read.
- `@env-hopper/backend-core/testing` exports the helpers that set up and reset
  a catalog test database.
