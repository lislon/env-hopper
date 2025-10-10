# Frontend Example

1. Copy .env.example to .env (default `VITE_EH_MODE=catalog`; switch to `hopper` for full UI).
2. Install deps at repo root: `pnpm install`.
3. Start backend example (port 4001): `pnpm --filter @env-hopper/backend-example dev`.
4. Start this app (port 4000): `pnpm --filter @env-hopper/frontend-example dev` and open http://localhost:4000.
