---
'@env-hopper/frontend-core': patch
---

Publish with the npm CLI so releases stop silently dropping packages.

`pnpm changeset publish` reported success for packages that never reached the
registry. Three releases in a row landed five of six — a different one missing each
time — while the log listed all six as published, so the only way to notice was to
query the registry per package afterwards. pnpm 11 regressed its spawned
`npm publish` path so it no longer reaches npm's OIDC mint.

Releases now pack with pnpm, which is what resolves `workspace:*` into the tarball,
and publish each tarball with the npm CLI, which performs the mint and fails per
package instead of reporting a success it did not achieve. A version already on the
registry is skipped, so re-running a partially failed release is safe.

`NPM_TOKEN` is gone from the workflow; trusted publishing covers both paths.
