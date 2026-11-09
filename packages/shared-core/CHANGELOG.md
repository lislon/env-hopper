# @env-hopper/shared-core

## 2.9.0

### Minor Changes

- [#429](https://github.com/lislon/env-hopper/pull/429) [`db49a8a`](https://github.com/lislon/env-hopper/commit/db49a8aea3c24218284470b359effb8e16241786) Thanks [@lislon](https://github.com/lislon)! - New package `@env-hopper/mcp`: `createMcpHandler({ backend, catalog?, examples?, notes?, publicUrl? })` serves an MCP server over Streamable HTTP (stateless) from a deployment's own data, for agents that want app links, shared test logins and database access. Five tools: `get_url(env?, app?, jump?, params?)` (any subset; params alone find the jumps that take them), `get_login(app, env)`, `get_database_access(app, env)`, `list_apps(query?)` and `list_envs(query?, app?)` (with an app: where it is deployed, its version and health, or `deployedTracked: false`). Every lookup answers in one envelope: the env/app/jump/params it used (`null` = matched nothing, with `options`), `url`, `ehUrl`, `missingParams` with `homeUrl`, `unusedParams`, `logins`/`databases` (`[]` = none) or `requestAccess` on an env that shares no login, built from the deployment's access request card. The server instructions are a template filled with the deployment's params, examples and notes. Urls are rendered server-side with the shared-core template functions, the way the UI renders them.

  The fuzzy matcher moved from frontend-core to shared-core (`fuzzySearch`, `makeFuzzySearchIndex`, `tokenize`), unchanged for the UI; its results now carry their rank. On top of it, `pickMatch` decides what words name: exact slug, name or alias is picked; a clear winner is picked with the runner-up as an option; a close call picks nothing and lists the equally good ones; no match lists the closest spellings.

  `LateResolvableParam` and `ResourceJump` take `aliases` (matched exactly), and `LateResolvableParam` takes `defaultJump`, the jump to open when several take the param and nothing tells them apart.

## 2.8.3

## 2.8.1

## 2.8.0

## 2.7.0

## 2.6.1

## 2.6.0

## 2.5.0

## 2.4.0

## 2.3.0

## 2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Send `bootstrap`'s Environments packed. Per field, the rule most Environments
  follow (a constant, or a value built from the Environment's slug) goes once in
  the new `envDefaults`, and each Environment carries only what differs; `null`
  removes a default. `packEnvs` and `expandEnv` (shared-core) do the two halves,
  and the server sends explicit any Environment that would not round-trip. Every
  other `bootstrap` key is unchanged.

## 2.1.0-alpha-20261014235627

### Patch Changes

- Snapshot release from alpha branch

## 2.1.0-alpha-20261013000513

### Patch Changes

- Snapshot release from alpha branch

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
