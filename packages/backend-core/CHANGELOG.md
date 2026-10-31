# @env-hopper/backend-core

## 2.7.0

### Minor Changes

- [#421](https://github.com/lislon/env-hopper/pull/421) [`6b93896`](https://github.com/lislon/env-hopper/commit/6b938962588e5f9cde89c1a188dad607f7c5fbb9) Thanks [@lislon](https://github.com/lislon)! - Release-train card: each build is named once with the environments running it, plus a link to its commit (from the Component's `commitUrl`); a long build name ends in "…" instead of leaving the card; an upcoming train can link its release branch (`ReleaseTrain.releaseBranch`); dates outside this year show the year; "your time" drops UTC; the row shows a pointer and a click pins the card. No layout shift on revisit: each App's last answer is kept per device and favourite and recent Apps are prefetched (ADR 0008).

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.7.0
  - @env-hopper/table-sync@2.7.0

## 2.6.1

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.6.1
  - @env-hopper/table-sync@2.6.1

## 2.6.0

### Minor Changes

- [#418](https://github.com/lislon/env-hopper/pull/418) [`d5bdc27`](https://github.com/lislon/env-hopper/commit/d5bdc2794b7869b63fabacc6bb47ff92a5aa01a1) Thanks [@lislon](https://github.com/lislon)! - Release trains beside the form: the release production runs and the next two, each with its date and, when a source knows it, its time in the deployment's zone. A card on hover shows every source's date (disagreements flagged, never resolved), the instructions tickets, release notes, and the environments running the train with the build there. A deployment supplies them through the new optional `getReleaseTrains` on `EhBackendCompanySpecificBackend`; the `releaseTrains` procedure picks the trains and joins the deployments.

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.6.0
  - @env-hopper/table-sync@2.6.0

## 2.5.0

### Minor Changes

- [#417](https://github.com/lislon/env-hopper/pull/417) [`33855b2`](https://github.com/lislon/env-hopper/commit/33855b21e522967a84efeda4d56da65ee2cba479) Thanks [@lislon](https://github.com/lislon)! - The access-request card now sits inside the credentials widget's own gutter and rule, as a quiet link with no box until hover or focus. `EhAccessRequestCard.cta` is optional, and the new optional `iconLabel` puts the icon on the second line, right before that label.

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.5.0
  - @env-hopper/table-sync@2.5.0

## 2.4.0

### Minor Changes

- [#416](https://github.com/lislon/env-hopper/pull/416) [`da3bd99`](https://github.com/lislon/env-hopper/commit/da3bd9969a96af16a72547d23f0f7db43641f7e9) Thanks [@lislon](https://github.com/lislon)! - Add an optional access-request card: on an environment that shares no login, the credentials slot shows where to request your own access, configured by `customization.accessRequestCard`. Widget and link templates can use `{{app.displayName}}`.

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.4.0
  - @env-hopper/table-sync@2.4.0

## 2.3.0

### Minor Changes

- [#415](https://github.com/lislon/env-hopper/pull/415) [`8068539`](https://github.com/lislon/env-hopper/commit/80685396aab7b2f67c3356500369425aa418c2e2) Thanks [@lislon](https://github.com/lislon)! - Delivery facts: Repository, Commit, Build, Tag, Change Request, Work Item and Declared Version, written once by an Entity Provider (`writeFacts`) and read back (`readFacts`), and the Build an Artifact was made by. source-gitlab maps pipelines, tags, releases and merge requests onto them and lists tags and releases incrementally.

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.3.0
  - @env-hopper/table-sync@2.3.0

## 2.2.0

### Minor Changes

- [#414](https://github.com/lislon/env-hopper/pull/414) [`a5de764`](https://github.com/lislon/env-hopper/commit/a5de76454119799b9317c37fa1eef0e4c105aa50) Thanks [@lislon](https://github.com/lislon)! - Add opt-in guard to prevent mass deletions during catalog sync

  Catalog syncs can now set `maxDeleteShare` (0..1) to refuse a run that would delete most of a table. When set and existing >= 5 and toDelete/existing > maxDeleteShare, no deletes happen (creates and updates still do), and the result includes `refusedDeletes` with the count it would have deleted. Protects against broken sources that suddenly return far fewer rows than normal.

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.2.0
  - @env-hopper/table-sync@2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Entity Provider writes how fresh each AppEnv is (`syncAppEnvFreshness`): when its reads were last confirmed, which Sources are being read now, and the last read that failed. The pair stream sends it in each AppEnv's deployment chunk, also when nothing is deployed there. Adds the `EhUser` and `UserEvent` tables for usage.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Send `bootstrap`'s Environments packed. Per field, the rule most Environments
  follow (a constant, or a value built from the Environment's slug) goes once in
  the new `envDefaults`, and each Environment carries only what differs; `null`
  removes a default. `packEnvs` and `expandEnv` (shared-core) do the two halves,
  and the server sends explicit any Environment that would not round-trip. Every
  other `bootstrap` key is unchanged.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Pack each `getBootstrapData` object once. A backend that returns the same
  object until its data changes, and a new one when it does, now costs one pack
  per change instead of one per request. `pair` and `slices` no longer ask for
  the bootstrap data at all.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add the deployment catalog: its schema and its read/write API.
  - New Prisma models for Environments, Apps, Components, Deployment Targets,
    Releases, Artifacts, Deployments, Users, Endpoints and Health, in the core's
    migration history.
  - `createCatalog()` returns a `Catalog`: `syncX(tx, scope, list)` writers in one
    `transaction`, and reads (`listDeployments`, `resolveAlias`,
    `getPairDeployments`, `getComponents`).
  - `createEhMiddleware` takes an optional `catalog`, which the `pair` and
    `slices` queries read.
  - `@env-hopper/backend-core/testing` exports the helpers that set up and reset
    a catalog test database.

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

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A change request is one line: its Work Items, each linked to its page when the bootstrap's `ui.workItemUrl` (a template with `{{key}}`) says where they live, then its title, linked to the change request. Its description is no longer shown. The details dialog has a "Read from" row (the Source each Version came from) and a footer naming each Source the AppEnv is read from and when (`AppEnvFreshness.sources`, a new nullable column). The test kit's fixture takes `ui`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - An Artifact keeps the change request it was built from, or that merged it into
  the branch it was built from, as a `ChangeRequestRef` (`id`, `url`, optional
  `title` and `workItems`, and `direct`). A pair's Deployment row and its Deploy
  Attempt carry their build's as `changeRequest`; a row whose build has none is
  unchanged. `CatalogArtifactInput.changeRequest` takes the ref instead of the
  bare id. The new `changeRequestDetails` query asks the deployment's optional
  `getChangeRequestDetails` for a change request's description and sends its
  first 2048 characters, or an empty one when the deployment keeps none.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - - An Artifact stores the commit it was built from (`commitSha`), and a
  Component the page of a commit of its code (`commitUrl`, with `{{sha}}`).
  A pair's row carries `commitSha` and its Component `commitUrl`; the
  deployed-version details show a Commit column with the short sha linked to
  that page, and link the Version to its build pipeline.
  - A GitLab deployment record names who ran its deploy job (`jobUser`) beside
    `user`, who created the record.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The catalog stores Deploy Attempts: a deploy run of an Artifact to a Target
  that has not succeeded, at most one per (Component, Target), written by the
  Entity Provider with `syncDeployAttempts`. A pair's Deployment row carries the
  newest attempt on its Environment's Targets as `attempt`, with its Artifact's
  aliases, build link and commit, and its starter among the pair's `users`. A
  row with no attempt is unchanged. Deleting a Component, Target or Artifact now
  reports the pairs whose Deployments or attempts it cascade-deletes.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A pair's Deployment row names where a cluster runs it: `cluster`, `namespace`
  and `kubeContext`, from its Target's `meta` of the same names. The deployed
  version's tooltip and details show `cluster/namespace`, and the kubernetes
  commands beside the form use the context and namespace of the selected app's
  lead Component when the catalog knows them, else the environment's own.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - An audit trail of what each AppEnv showed: `DeploymentHistory` gets a row each time a sync makes a Deployment appear, change its version or deploy time (a redeploy), or go, and each time an attempt starts or changes status. It is written in the same transaction as the change and never updated or deleted. `getDeploymentHistory({ app?, env?, component?, from?, to? })` reads it, newest first, at most 1000 rows.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A diagnostics panel for staging and previews: where the bootstrap's `ui.diagnostics` is on, `?debug=1` or Ctrl+Shift+D opens it under the Version line. It shows attention (attentive or idle, last activity), each `pair` fetch, answer and `pairsWatch` push the pair got with its freshness, and the backend's recent checks (`diagnostics`, from the deployment's `getDiagnostics`). "Copy diagnostics" copies them as JSON with secret-named keys dropped and credentials in strings replaced. The `diagnostics` query is NOT_FOUND (404) unless `ui.diagnostics` is on, and serves each event's detail made safe for a browser.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A freshness change reaches the open page: writing an AppEnv's freshness notifies `pairsWatch` like any change, and an App-wide row (`env` `*`) is pushed to each Environment the client watches. So a check that ends clears the line's ring at once instead of at the next refetch; a `reading` the page holds 20 s with no push is asked for again. A failed check may say why: `failed.reason` (`timeout`, `unauthorized`, `unreachable`, `bad-response`) and `failed.message`, which the core stores made safe for a browser (`publicMessage`: first line only, no URLs, hosts, IPs, emails, SQL or secrets, at most 160 characters). The tooltip reads "Couldn't check audit (timed out: …) · showing the value from 41 min ago".

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add a Health Check runner for the catalog.
  - `HealthChecker<TConfig>` is the contract a checker implements; it may declare
    the state a timeout means (`timeoutState`, default `down`).
  - `httpHealthChecker` probes a URL and reads `healthy`, `degraded` (body
    mismatch), `down` or `unknown`.
  - `runCheck` runs one check under a deadline; `runHealthChecks` runs many, and
    a check that throws reads `unknown` instead of failing the pass.
  - `sanitizeUrl` strips credentials, so no stored or returned detail carries
    them.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Two writers of one change write one row. A DeploymentHistory row carries `eventAt`, the Source's time of the change (a deploy's or removed Deployment's `deployedAt`, an attempt's start or end), and is unique by Component, Target, kind, version and `eventAt`; it is inserted with ON CONFLICT DO NOTHING. A removal names the version that went away in `version`. `usage.record` takes the browser's `eventId` (a UUID) and `at` (kept within a day before and 5 minutes after the server's clock); an event sent twice is kept once, and `receivedAt` keeps the server's time.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Stream an App's details on an Environment by facet: `pair` and `slices`.
  - `pair({ appSlug, envSlug })` streams one pair's jumps and deployment, each
    chunk as soon as its source answers. `slices({ appSlugs?, envSlugs? })`
    streams every App on each Environment and every Environment each App is
    deployed on, at most 50 of each, without jumps.
  - A stream sends what its pairs share once: each App's Components, with the
    pipeline URL its links fit, so rows carry pipeline ids; the Health run time;
    and, from `pair` only, the deployers' profiles. `slices` names deployers by
    username, and the new `users({ usernames })` query answers their profiles.
  - The catalog reads a pair's Deployments with `getPairDeployments` and each
    App's Components with `getComponents`. A Component's pipeline URL depends on
    the Component alone, so the same input gives the same chunks.
  - The client keeps each pair's facets in its own cache entry, never fetches a
    pair a slice already loaded, asks the profiles missing in one tick in one
    `users` call, and shows the deployed version under the jump card.
  - Credentials stay in `bootstrap`; the streams do not repeat them.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Push catalog changes to the browser.
  - `Catalog.onChange(listener)` hears every committed transaction that changed
    a Deployment, its Endpoints or its Health (a Health only checked again is no
    change), as the pairs (App, Environment) it touched; `lastChangeId()` names
    the last one.
  - New tRPC subscription `pairsWatch({ appSlugs?, envSlugs?, lastEventId? })`
    over server-sent events: each change of a pair in those slices arrives as the
    chunks `slices` would send for it. Events carry tracked ids; a client back
    with an older id, or after a server restart, gets its whole scope again.
  - Subscriptions send a ping every 15 s. Server-sent events go out
    uncompressed (tRPC marks them `no-transform`).

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Remove the `availabilityMatrix` endpoint, which always returned an empty matrix.

  A company backend no longer implements `getAvailabilityMatrix`, and the
  `AvailabilityMatrixData` and `AvailabilityVariant` types are gone. The frontend
  helpers that read the matrix, `findBestMatchByUrl` and `availabilityMatrixUtils`,
  had no callers and are removed with it. Which Versions run where now comes from
  the deployment facet of `pair` and `slices`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Compress responses with gzip or brotli. `ehCompression()` is exported for
  servers built without `createEhMiddleware`, which now mounts it first.
  Streamed queries and server-sent events stay streamed: each chunk is flushed
  the moment it is written.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A browser keeps the id the previous UI gave it: `usage.record` takes an optional `legacyUserId`, and a browser with no `eh_uid` cookie is named by it when it is a UUID (else by a new one). The cookie is set by the first `usage.record`, not by any request. Signing in links the browser to the account for good: `EhUser.userId` is set at its first sign-in and never changed; one account may own several browsers. `getUserEvents(since, { userId })` returns a User's history across every browser linked to the same account, and each event names its `ehUserId` and, once linked, its `userId`. The context takes `ehUser: ehUserOf(req, res)`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - What a User does is kept: `usage.record` stores each `open` of an AppEnv and each `jump` from it as a `UserEvent`, under an `EhUser` named by an httpOnly `eh_uid` cookie (and the login, once signed in). The Catalog reads them back with `getUserEvents(since)`. A deployment's backend may implement `warm(appEnvs, reason)`: it is told which AppEnvs someone looks at now, to read what they show again: each `pair` asked for (`view`; the open pair is asked again while it tracks freshness) and each `jump`. The frontend records an `open` when the page shows another AppEnv, and a `jump` when a link is followed. The test kit's mock backend answers `usage.record`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Version line shows its freshness quietly: a Version older than `ui.upToDateFreshnessMs` (default 30 s) greys, a faint ring turns while it is read again, and a check that failed since says "couldn't check"; the tooltip says when it was checked. The pair on screen is read again twice per that interval while its Entity Provider tracks freshness. A "Deployed version" label sits above the line, and a Deploy Attempt is a second line: a progress bar while it runs, then ✓, ✕ or ⊘, with a link to its job. An attempt that succeeds turns green while the Versions swap.

### Patch Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A change request may name the branch it merged from (`ChangeRequestRef.sourceBranch`).

- Updated dependencies [[`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd)]:
  - @env-hopper/shared-core@2.1.0
  - @env-hopper/table-sync@2.1.0

## 2.1.0-alpha-20261014235627

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.1.0-alpha-20261014235627
  - @env-hopper/table-sync@2.1.0-alpha-20261014235627

## 2.1.0-alpha-20261013000513

### Patch Changes

- Snapshot release from alpha branch

- Updated dependencies []:
  - @env-hopper/shared-core@2.1.0-alpha-20261013000513
  - @env-hopper/table-sync@2.1.0-alpha-20261013000513

## 2.1.0-alpha-20260930195630

### Patch Changes

- Updated dependencies []:
  - @env-hopper/shared-core@2.1.0-alpha-20260930195630
  - @env-hopper/table-sync@2.1.0-alpha-20260930195630

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
