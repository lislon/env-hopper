## Quick orientation
## Quick orientation

Small, focused notes for an AI coding agent working in this repo (pnpm + Nx TypeScript monorepo).

- Key projects:
  - `packages/frontend-core` — primary front-end app, components and integration tests (see `src/__tests__/integration`).
  - `packages/backend-core` — server logic and Prisma schema at `packages/backend-core/prisma/schema.prisma`.

Use pnpm at the repo root and prefer PowerShell on Windows (project scripts and CI assume pnpm/Nx).

## Essential commands (copyable)
- Install: `pnpm install` (repo root)
- Start frontend dev: `cd packages/frontend-core && pnpm run dev` (or use Nx targets)
- Run one integration test (fast):
  - From package: `cd packages/frontend-core && pnpm test src/__tests__/integration/resourceJump.integration.test.tsx`
  - Or via nx: `nx run @env-hopper/frontend-core:test:unit -- src/__tests__/integration/resourceJump.integration.test.tsx`
- Run all frontend tests: `pnpm run test:frontend-core` or `pnpm --filter @env-hopper/frontend-core... test`
- Build frontend-core: `pnpm --filter @env-hopper/frontend-core... build`
- Prisma local reset: `pnpm prisma db push --force-reset` (see `.cursor/rules/prisma.mdc`)

## Project-specific conventions (short)
- Always use pnpm and Nx-aware commands; avoid npm/yarn that bypass the workspace.
- Prefer named exports; avoid default exports for library code.
- Fix types rather than using `any` or `!` non-null assertions.
- Avoid generic `index.ts` re-exports unless that `index.ts` is declared as the package main export.

## Testing & patterns
- Integration tests use a semantic `ui` testing API (see `.cursor/rules/integration-tests.mdc`); prefer user-centric helpers over raw DOM queries.
- The codebase uses TanStack Query patterns (queryKey conventions, optimistic updates). See `packages/frontend-core` and `.cursor/rules/tanstack-query.mdc` for idiomatic snippets.

## Important files to inspect when implementing features
- Frontend routes and entry points: `packages/frontend-core/src/index.tsx`, `App.tsx`, `routeTree.gen.ts`.
- UI components and shadcn config: `packages/frontend-core/src/components`, `components.json`, `src/ui`.
- Shared utilities: `packages/shared-core/src`.
- Backend prisma schema: `packages/backend-core/prisma/schema.prisma`.

## Integration points & notes
- Shadcn UI components wired via `components.json` and TS path aliases in `tsconfig.json`.
- TanStack Query + trpc are used for data; follow existing queryKey and optimistic update patterns.
- Prisma usage lives in `packages/backend-core`; avoid creating many small migrations during iterative dev—use `db push` for local resets.

## Where to look for repo-specific rules
- `.cursor/rules/*` (prisma, testing, shadcn, tanstack-query) — contains actionable snippets and local conventions.

If you'd like, I can further shorten any section or add quick examples that show where to change code for a specific task (tests, route changes, or adding a UI component). Please tell me which area to expand.
## Examples (copyable snippets)
