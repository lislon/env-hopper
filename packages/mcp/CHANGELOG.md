# @env-hopper/mcp

## 2.9.0

### Minor Changes

- [#429](https://github.com/lislon/env-hopper/pull/429) [`db49a8a`](https://github.com/lislon/env-hopper/commit/db49a8aea3c24218284470b359effb8e16241786) Thanks [@lislon](https://github.com/lislon)! - New package `@env-hopper/mcp`: `createMcpHandler({ backend, catalog?, examples?, notes?, publicUrl? })` serves an MCP server over Streamable HTTP (stateless) from a deployment's own data, for agents that want app links, shared test logins and database access. Five tools: `get_url(env?, app?, jump?, params?)` (any subset; params alone find the jumps that take them), `get_login(app, env)`, `get_database_access(app, env)`, `list_apps(query?)` and `list_envs(query?, app?)` (with an app: where it is deployed, its version and health, or `deployedTracked: false`). Every lookup answers in one envelope: the env/app/jump/params it used (`null` = matched nothing, with `options`), `url`, `ehUrl`, `missingParams` with `homeUrl`, `unusedParams`, `logins`/`databases` (`[]` = none) or `requestAccess` on an env that shares no login, built from the deployment's access request card. The server instructions are a template filled with the deployment's params, examples and notes. Urls are rendered server-side with the shared-core template functions, the way the UI renders them.

  The fuzzy matcher moved from frontend-core to shared-core (`fuzzySearch`, `makeFuzzySearchIndex`, `tokenize`), unchanged for the UI; its results now carry their rank. On top of it, `pickMatch` decides what words name: exact slug, name or alias is picked; a clear winner is picked with the runner-up as an option; a close call picks nothing and lists the equally good ones; no match lists the closest spellings.

  `LateResolvableParam` and `ResourceJump` take `aliases` (matched exactly), and `LateResolvableParam` takes `defaultJump`, the jump to open when several take the param and nothing tells them apart.

### Patch Changes

- Updated dependencies [[`db49a8a`](https://github.com/lislon/env-hopper/commit/db49a8aea3c24218284470b359effb8e16241786)]:
  - @env-hopper/shared-core@2.9.0
  - @env-hopper/backend-core@2.9.0
