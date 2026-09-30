# @env-hopper/shared-core

## 2.1.0-alpha-20260930195630

## 2.1.0-alpha-20260930191116

### Minor Changes

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
