# @env-hopper/table-sync

## 2.6.0

## 2.5.0

## 2.4.0

## 2.3.0

## 2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Sync the catalog by scope, in one transaction per run, and record who deployed.
  - Every catalog write is `syncX(tx, scope, list)`: rows of the scope the list
    no longer reports are deleted with what depends on them, changed rows are
    updated and identical rows left alone. Readers never see half a run.
  - Users are catalog rows a Deployment names as its deployer; deleting one
    keeps the Deployment without a deployer.
  - table-sync: keys are JSON-encoded, `sync()` returns created, updated,
    deleted and unchanged counts with the deleted rows, and `findIdMaybe` no
    longer returns the id of a row the sync just deleted.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Every catalog sync takes an optional `{ upsertOnly: true }`: the listed rows
  are created or updated and nothing in the scope is deleted, for a run that
  knows only part of what the scope holds. table-sync's `sync()` also returns the
  rows it created and the rows it changed, each with what it was before.

## 2.1.0-alpha-20261014235627

### Patch Changes

- Snapshot release from alpha branch

## 2.1.0-alpha-20261013000513

### Patch Changes

- Snapshot release from alpha branch

## 2.1.0-alpha-20260930195630

## 2.1.0-alpha-20260930191116

## 2.0.1-alpha-20260812145859

### Patch Changes

- Snapshot release from alpha branch

## 2.0.1-alpha-20260706164459

### Patch Changes

- Snapshot release from alpha branch

## 2.0.1-alpha-20260301025624

### Patch Changes

- Snapshot release from alpha branch

## 2.0.1-alpha-20260228191003

### Patch Changes

- Snapshot release from alpha branch

## 2.0.1-alpha-20260224192214

### Patch Changes

- Snapshot release from alpha branch

## 2.0.1-alpha-20260224152429

### Patch Changes

- Changed readme

## 2.0.1-alpha-20260224145405

### Patch Changes

- Alpha snapshot release

## 0.0.0-alpha-20260224145132

### Patch Changes

- Alpha snapshot release
