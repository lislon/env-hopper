# @env-hopper/frontend-core

## 2.1.0-alpha-20260930191116

### Minor Changes

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Read parameter behaviour flags from the `contexts` a deployment declares.

  `isSharedAcrossEnvs` is served in `BootstrapConfigData.contexts`, which nothing
  read, while the cross-cutting params context took its definitions from
  `lateResolvableParams`, which nothing populates with that flag. Both are keyed by
  the same slug vocabulary, so the flags are now joined onto the params a jump asks
  for — meaning the environment-scoping behaviour works against data a deployment
  already serves, with no configuration change.

  Driven from the params, so a context with no matching parameter cannot become a
  phantom one. A context wins only where it states a flag; otherwise whatever the
  parameter itself declared is kept.

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

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Let a url template follow a fallback chain and a two-hop pattern, so a shared url shape is configured once instead of per environment.
  - The right side of `??` is now tried as a parameter key before being treated as
    a literal, and chains of any length are evaluated left to right with the first
    hit winning: `{{env.meta.baseUrl ?? app.meta.baseUrl ?? https://example.com}}`.
    An empty right side still means "substitute nothing".
  - A substituted value may itself contain placeholders and they are resolved too,
    capped at `MAX_TEMPLATE_PASSES` (2) — enough for a pattern named at app level
    to be filled in with per-environment values. Only the text a pass substituted
    in is scanned again, never the rest of the string, so a value a user typed can
    never be read as template syntax and a self-referential key terminates.
  - A jump url can resolve against the app's environment-independent placeholders,
    ranked below environment params, the jump's per-environment params, and the
    values the user supplies.

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Add a UI settings seam so a consuming app can contribute content inside core layouts.

  `App` takes an optional `uiSettings` prop (`EhUiSettings`) carrying a footer slot,
  about pages and templated app links; `useUiSettings()` and `useEhTemplate()` are
  exported for consumers. `useEhTemplate()` resolves `{{app.*}}`, `{{env.*}}` and the
  selected environment's template params, and `substituteTemplate` now understands a
  `{{key ?? default}}` operator — including an empty default.

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

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Add `@env-hopper/test-kit`, an integration test harness that mounts the real app
  against a mock backend and exposes page objects plus cucumber step definitions,
  so behaviour can be pinned down independently of the UI implementing it.
  Downstream suites reuse the steps against their own fixtures via
  `registerCatalog`.

  `frontend-core` gains an `./internal` subpath carrying the pieces the harness
  mounts the app with. It has no stability guarantee and moves in lockstep with the
  test kit.

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Serve the real bootstrap config to the client, so meta-driven templates can resolve.

  `BootstrapConfigProvider` was handed a hardcoded empty object with its query
  commented out, so `{{app.meta.*}}` and `{{env.meta.*}}` resolved against nothing.
  The query is wired back, deliberately without gating the app on it: the provider
  falls back to an empty config, which degrades exactly as an unresolved template
  already does rather than turning a bootstrap failure into a permanent loading
  screen.

  Also fixes the query reading `['config']` while its own background refresh wrote
  `['bootstrapConfig']`, which left the client a fetch behind until a reload.

### Patch Changes

- [#397](https://github.com/lislon/env-hopper/pull/397) [`efbbc57`](https://github.com/lislon/env-hopper/commit/efbbc57b56a7f6e36afd5acd404c52532cde8824) Thanks [@lislon](https://github.com/lislon)! - Show the running version on a first visit, not only after a reload.

  The header read the version out of local storage, which `useEhServerSync` is what
  writes. `useLocalStorage` is `useState` per instance with no subscription between
  instances, so the reader kept its first — empty — value for the life of the page:
  a first-time visitor saw the "no version known" label while storage already held
  the right version, and a reload fixed it.

  `useEhServerSync` now returns `appVersion` from the bootstrap payload, falling back
  to the stored copy when that payload is unavailable, and the header consumes it.
  One source, owned by the hook that writes the cache.

  `Fixture.appVersion` lets a test state what the deployment reports. Without it the
  only way to stage a version was to pre-seed local storage, which is precisely the
  case a first-time visitor is not — so the bug was unreachable from a test.

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
