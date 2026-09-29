---
'@env-hopper/test-kit': minor
'@env-hopper/frontend-core': minor
---

Add `@env-hopper/test-kit`, an integration test harness that mounts the real app
against a mock backend and exposes page objects plus cucumber step definitions,
so behaviour can be pinned down independently of the UI implementing it.
Downstream suites reuse the steps against their own fixtures via
`registerCatalog`.

`frontend-core` gains an `./internal` subpath carrying the pieces the harness
mounts the app with. It has no stability guarantee and moves in lockstep with the
test kit.
