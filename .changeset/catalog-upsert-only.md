---
'@env-hopper/backend-core': minor
'@env-hopper/table-sync': minor
---

Every catalog sync takes an optional `{ upsertOnly: true }`: the listed rows
are created or updated and nothing in the scope is deleted, for a run that
knows only part of what the scope holds. table-sync's `sync()` also returns the
rows it created and the rows it changed, each with what it was before.
