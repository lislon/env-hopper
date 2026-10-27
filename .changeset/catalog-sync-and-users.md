---
'@env-hopper/backend-core': minor
'@env-hopper/table-sync': minor
---

Sync the catalog by scope, in one transaction per run, and record who deployed.

- Every catalog write is `syncX(tx, scope, list)`: rows of the scope the list
  no longer reports are deleted with what depends on them, changed rows are
  updated and identical rows left alone. Readers never see half a run.
- Users are catalog rows a Deployment names as its deployer; deleting one
  keeps the Deployment without a deployer.
- table-sync: keys are JSON-encoded, `sync()` returns created, updated,
  deleted and unchanged counts with the deleted rows, and `findIdMaybe` no
  longer returns the id of a row the sync just deleted.
