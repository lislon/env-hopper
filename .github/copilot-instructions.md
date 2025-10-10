## What is this project?

EnvHopper is a developer tool for managing parameterized bookmarks across different environments (dev, staging, prod). It helps QAs and developers quickly switch between webapp instances and environments with URL templates and parameters.

## Architecture overview

**Monorepo structure (pnpm + Nx):**

- `packages/frontend-core` — React SPA using TanStack Router, TanStack Query, tRPC client, Shadcn UI (New York style)
- `packages/backend-core` — Express + tRPC server with Prisma ORM, dependency injection via tsyringe
- `packages/shared-core` — Shared types and utilities (Zod schemas)
- `packages/frontend-build-vite` — Shared Vite configuration
- `examples/` — Example apps for development (backend-example, frontend-example)

**Module structure mirroring:**

- Backend (`packages/backend-core/src/modules/`) and frontend (`packages/frontend-core/src/modules/`) should mirror each other when possible
- Example: admin chat lives in `backend-core/src/modules/admin/chat/` and `frontend-core/src/modules/admin/`
- Example: icons management lives in `backend-core/src/modules/icons/` and `frontend-core/src/modules/icons/`
- Keep parallel features in similarly named directories for easier navigation

**Data flow:\*\***

- Frontend → tRPC client → backend tRPC routes → Prisma → SQLite (dev) or PostgreSQL (prod)
- Local IndexedDB (`EhDb`) for client-side caching via `packages/frontend-core/src/userDb/`
- TanStack Query manages server state with optimistic updates

**Key integration points:**

- `App.tsx` wires QueryClient, TRPCProvider, DbProvider, RouterProvider
- Route generation happens via `@tanstack/router-plugin` producing `routeTree.gen.ts`
- Shadcn UI configured in `components.json` with path aliases (`~/components`, `~/ui`, `~/lib`)

## Essential commands

**Setup & development:**

```bash
pnpm install                                     # Install all workspace deps
cd packages/backend-core && pnpm run dev         # Start backend dev server (tsx watch)
cd examples/frontend-example && pnpm run dev     # Start example frontend app (localhost:3999)
```

**Testing (prefer these over nx directly):**

```bash
# Run single integration test (fastest feedback loop)
cd packages/frontend-core
pnpm test src/__tests__/integration/resourceJump.integration.test.tsx

# Or from root via nx
nx run @env-hopper/frontend-core:test:unit -- src/__tests__/integration/resourceJump.integration.test.tsx

# Run all frontend tests
pnpm run test:frontend-core
# or: pnpm --filter @env-hopper/frontend-core... test
```

**Building & database:**

```bash
pnpm --filter @env-hopper/frontend-core... build   # Build with dependencies
pnpm prisma db push --force-reset                  # Reset local dev DB (no migrations)
pnpm prisma:generate                               # Regenerate Prisma client
```

**Platform note:** Use PowerShell on Windows (CI and project scripts assume pnpm/PowerShell, not cmd).

## Frontend Core usage

- `packages/frontend-core` is a library (not a standalone app). It provides reusable UI, routing, and client logic consumed by frontend apps.
- For interactive UI development, run an app that consumes the library (e.g., `examples/frontend-example`) rather than starting `frontend-core` directly.
- When working on `frontend-core` itself (components, routes, hooks), use the example app to exercise changes, or rely on unit/integration tests in `frontend-core`.

## Code conventions & patterns

**Exports & types:**

- Named exports only (no default exports except for routes/pages)
- Avoid `any` and `!` non-null assertions—fix types at the source
- No `index.ts` re-exports unless that file is the package entry point in `package.json`

**Database & Prisma (CRITICAL):**

- **Prisma is internal to backend-core only**. The schema is at `packages/backend-core/prisma/schema.prisma`
- Do NOT add/modify Prisma schemas in example projects (like `examples/backend-example`)
- Example projects may have their own local schemas for documentation only, but auth/core models live in backend-core
- To migrate: Run `pnpm prisma db push --force-reset` from the root (operates on backend-core schema)
- To regenerate: `pnpm prisma:generate` (regenerates client in backend-core)
- All data models (auth, icons, apps, etc.) belong in `packages/backend-core/prisma/schema.prisma`

**Testing patterns:**

- Integration tests use semantic `ui` API from `renderApp()` helper (see `packages/frontend-core/src/__tests__/integration/helpers/renderWithProviders.tsx`)
- Example: `await ui.resourceJump.env.select('dev')` instead of raw DOM queries
- Prefer one comprehensive test over many small tests
- Test factories in `__tests__/integration/factories/` (BackendMagazine, DbMagazine, simpleDSL)

**TanStack Query conventions (critical):**

- Query keys follow hierarchical structure: `['todos']`, `['todos', id]`
- Optimistic updates via `onMutate` + cache snapshots, rollback in `onError`, invalidate in `onSettled`
- See `.cursor/rules/tanstack-query.mdc` for full examples

**Prisma workflow:**

- During development: modify `schema.prisma` and run `pnpm prisma db push --force-reset`
- Avoid creating multiple migrations for iterative changes
- Single migration edits are allowed when necessary
- See `.cursor/rules/prisma.mdc`

## Key files for feature work

**Frontend routing & entry:**

- [packages/frontend-core/src/index.tsx](../packages/frontend-core/src/index.tsx) — Main entry point
- [packages/frontend-core/src/App.tsx](../packages/frontend-core/src/App.tsx) — Provider setup (QueryClient, tRPC, DB, Router)
- [packages/frontend-core/src/routeTree.gen.ts](../packages/frontend-core/src/routeTree.gen.ts) — Auto-generated route tree (don't edit manually)
- [packages/frontend-core/src/routes/](../packages/frontend-core/src/routes/) — File-based routing

**UI & styling:**

- [packages/frontend-core/components.json](../packages/frontend-core/components.json) — Shadcn config (style: new-york, CSS vars, Tailwind v4)
- [packages/frontend-core/src/components/](../packages/frontend-core/src/components/) — App-specific components
- [packages/frontend-core/src/ui/](../packages/frontend-core/src/ui/) — Shadcn UI components (auto-generated, edit carefully)
- [packages/frontend-core/src/index.css](../packages/frontend-core/src/index.css) — Tailwind v4 config with CSS imports

**Backend & data:**

- [packages/backend-core/prisma/schema.prisma](../packages/backend-core/prisma/schema.prisma) — Database schema
- [packages/backend-core/src/server/](../packages/backend-core/src/server/) — tRPC routes and Express setup
- [packages/backend-core/src/generated/](../packages/backend-core/src/generated/) — Prisma client output
- [packages/shared-core/src/](../packages/shared-core/src/) — Shared Zod schemas and types

**Testing infrastructure:**

- [packages/frontend-core/src/**tests**/integration/helpers/renderWithProviders.tsx](../packages/frontend-core/src/__tests__/integration/helpers/renderWithProviders.tsx) — Semantic UI test helpers
- [packages/frontend-core/src/**tests**/integration/factories/](../packages/frontend-core/src/__tests__/integration/factories/) — Test data factories

## Advanced patterns & gotchas

**Nx workspace:**

- Nx manages build cache and task dependencies (see `nx.json` targetDefaults)
- `prisma:generate` runs before `compile`, which runs before tests
- Use `nx affected` for CI, `nx run-many` for local builds
- Parallel execution limited to 2 by default (`"parallel": 2`)

**Shadcn + Tailwind v4:**

- Components use CSS variables for theming (see `baseColor: "neutral"` in components.json)
- Path aliases configured in both `tsconfig.json` and `components.json`
- Add new components: `npx shadcn@latest add [component]` (from frontend-core dir)

**tRPC + React Query integration:**

- tRPC client created in `App.tsx` via `createTRPCClient` with `httpLink`
- Wrapped in `TRPCProvider` which connects to React Query
- Backend types auto-imported via `TRPCRouter` from `@env-hopper/backend-core`

**IndexedDB local storage:**

- `EhDb` class (from `userDb/EhDb.ts`) uses Dexie.js
- Cache keys in `dbCacheDbKeys` for invalidation
- Test setup clears DB via `DbMagazine` factory

## Where to find detailed rules

- .cursor/rules/integration-tests.mdc — Semantic UI test API examples
- .cursor/rules/tanstack-query.mdc — Query keys, optimistic updates, mutation patterns
- .cursor/rules/prisma.mdc — Schema development workflow
- .cursor/rules/shadcn-ui.mdc — Component installation and usage
- .cursor/rules/testing-commands.mdc — Quick test commands reference
- .cursor/rules/env-hopper.mdc — Project-wide TypeScript conventions
