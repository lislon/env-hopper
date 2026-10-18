---
'@env-hopper/backend-core': minor
---

Add a Health Check runner for the catalog.

- `HealthChecker<TConfig>` is the contract a checker implements; it may declare
  the state a timeout means (`timeoutState`, default `down`).
- `httpHealthChecker` probes a URL and reads `healthy`, `degraded` (body
  mismatch), `down` or `unknown`.
- `runCheck` runs one check under a deadline; `runHealthChecks` runs many, and
  a check that throws reads `unknown` instead of failing the pass.
- `sanitizeUrl` strips credentials, so no stored or returned detail carries
  them.
