# @env-hopper/backend-core

## 2.1.0-alpha-20260930191116

### Minor Changes

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Make the value a legacy `/sub/<value>` link carries work again, and give parameters two behaviours they were missing.
  - A `/env/<env>/app/<app>/sub/<value>` link now routes, prefills, and produces a
    fully substituted target url. Nothing matched the `sub` segment before, and the
    value was stored under a slug no url template names, so it was silently dropped.
    Links the app emits (url sync, Share) keep the value too.
  - `LateResolvableParam` gains `isSharedAcrossEnvs`: a value that means the same
    thing everywhere survives an environment switch, one scoped to an environment
    no longer follows the user to where it does not exist.
  - `LateResolvableParam` gains `isBrowserAutocomplete`, and the parameter field
    carries a stable `name`, so a parameter can opt in to the browser suggesting a
    user's earlier values. Off by default.

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Give the version dialog structured rows, icons and a line saying what the app is for.

  The dialog a deployment opens from the version label took a single `versionHtml`
  blob and rendered it through `dangerouslySetInnerHTML`, which made the backend own
  this layout and put server-built markup on the page. It now takes
  `versionRows` — an icon id, a label, a value, an optional href and a one-line
  description each — plus `versionCredit` and `versionBuiltAt`. Icon ids resolve
  against the same `icons` list the app-link rows already use, and an id nothing
  shipped costs the row its icon, not the row.

  The core contributes the two rows true of every deployment: the package version it
  runs on and the project home. A short line under the title says what the app does,
  so the dialog reads as an about box rather than a build stamp.

### Patch Changes

- Updated dependencies [[`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22)]:
  - @env-hopper/shared-core@2.1.0-alpha-20260930191116
  - @env-hopper/table-sync@2.1.0-alpha-20260930191116

## 2.0.1-alpha-20260812145859

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260812145859
  - @env-hopper/table-sync@2.0.1-alpha-20260812145859

## 2.0.1-alpha-20260706164459

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260706164459
  - @env-hopper/table-sync@2.0.1-alpha-20260706164459

## 2.0.1-alpha-20260301025624

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260301025624
  - @env-hopper/table-sync@2.0.1-alpha-20260301025624

## 2.0.1-alpha-20260228191003

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260228191003
  - @env-hopper/table-sync@2.0.1-alpha-20260228191003

## 2.0.1-alpha-20260224192214

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260224192214
  - @env-hopper/table-sync@2.0.1-alpha-20260224192214

## 2.0.1-alpha-20260224152429

### Patch Changes

- Changed readme

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260224152429
  - @env-hopper/table-sync@2.0.1-alpha-20260224152429

## 2.0.1-alpha-20260224145405

### Patch Changes

- Alpha snapshot release

- Updated dependencies []:
  - @env-hopper/shared-core@2.0.1-alpha-20260224145405
  - @env-hopper/table-sync@2.0.1-alpha-20260224145405

## 0.0.0-alpha-20260224145132

### Patch Changes

- Alpha snapshot release

- Updated dependencies []:
  - @env-hopper/shared-core@0.0.0-alpha-20260224145132
  - @env-hopper/table-sync@0.0.0-alpha-20260224145132
