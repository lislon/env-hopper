# @env-hopper/frontend-core

## 2.5.0

### Minor Changes

- [#417](https://github.com/lislon/env-hopper/pull/417) [`33855b2`](https://github.com/lislon/env-hopper/commit/33855b21e522967a84efeda4d56da65ee2cba479) Thanks [@lislon](https://github.com/lislon)! - The access-request card now sits inside the credentials widget's own gutter and rule, as a quiet link with no box until hover or focus. `EhAccessRequestCard.cta` is optional, and the new optional `iconLabel` puts the icon on the second line, right before that label.

## 2.4.0

### Minor Changes

- [#416](https://github.com/lislon/env-hopper/pull/416) [`da3bd99`](https://github.com/lislon/env-hopper/commit/da3bd9969a96af16a72547d23f0f7db43641f7e9) Thanks [@lislon](https://github.com/lislon)! - Add an optional access-request card: on an environment that shares no login, the credentials slot shows where to request your own access, configured by `customization.accessRequestCard`. Widget and link templates can use `{{app.displayName}}`.

## 2.3.0

## 2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Checks follow attention. While someone is looking (the page visible and a mouse move, scroll, key, focus or touch within 2 minutes) the open pair is checked every half freshness window; a stale line with nothing checking it is asked for again within 3 seconds, and at once when the pointer moves onto it. While the User is idle or the tab hidden, the line may go stale with no ring, and the next activity checks it. `useAttention` and `IDLE_MS` say whether someone is looking.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Send `bootstrap`'s Environments packed. Per field, the rule most Environments
  follow (a constant, or a value built from the Environment's slug) goes once in
  the new `envDefaults`, and each Environment carries only what differs; `null`
  removes a default. `packEnvs` and `expandEnv` (shared-core) do the two halves,
  and the server sends explicit any Environment that would not round-trip. Every
  other `bootstrap` key is unchanged.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A change request is one line: its Work Items, each linked to its page when the bootstrap's `ui.workItemUrl` (a template with `{{key}}`) says where they live, then its title, linked to the change request. Its description is no longer shown. The details dialog has a "Read from" row (the Source each Version came from) and a footer naming each Source the AppEnv is read from and when (`AppEnvFreshness.sources`, a new nullable column). The test kit's fixture takes `ui`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The version details and the Deploy Attempt dialogs show a `Change request`
  row: `!id` linking to the change request (after "merged via" when the build is
  of the branch it merged into), its Work Items and title, and its description,
  asked of `changeRequestDetails` only once the dialog opens. A row without one
  says `n/a`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - - An Artifact stores the commit it was built from (`commitSha`), and a
  Component the page of a commit of its code (`commitUrl`, with `{{sha}}`).
  A pair's row carries `commitSha` and its Component `commitUrl`; the
  deployed-version details show a Commit column with the short sha linked to
  that page, and link the Version to its build pipeline.
  - A GitLab deployment record names who ran its deploy job (`jobUser`) beside
    `user`, who created the record.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The deployed-version line shows the newest deploy that has not succeeded as a
  chip after the Version: `↻ deploying <version>`, `✕ <version> failed · 5 min
ago` or `⊘ <version> canceled · 5 min ago`. The chip opens the attempt beside
  the current stable Version. When a running attempt succeeds, the new Version
  takes the old one's place with a short animation (a crossfade under reduced
  motion). Every relative time on the line reads one shared clock, so they move
  together.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - - The deployed-version slot under the jump card is always one line high and
  never empty: a pale placeholder while loading, "⚠ version unavailable" with
  the failed call, its message and the retry count on hover or focus, and
  "no version info" for an App with no catalog Components. It shows as soon
  as an App and an Environment are picked, before the URL is complete.
  - A `pair` load whose facet has not arrived within 10 s fails; a failed pair
    facet is retried every 30 s and on window focus. A loaded one is not
    refetched on focus.
  - The line shows the Version with its aliases and how long ago it was
    deployed; the details show the build pipeline and deploy job by id, and
    "n/a" where a value is unknown.
  - The jump card sits right under the Application field however tall the side
    panel is.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A pair's Deployment row names where a cluster runs it: `cluster`, `namespace`
  and `kubeContext`, from its Target's `meta` of the same names. The deployed
  version's tooltip and details show `cluster/namespace`, and the kubernetes
  commands beside the form use the context and namespace of the selected app's
  lead Component when the catalog knows them, else the environment's own.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A diagnostics panel for staging and previews: where the bootstrap's `ui.diagnostics` is on, `?debug=1` or Ctrl+Shift+D opens it under the Version line. It shows attention (attentive or idle, last activity), each `pair` fetch, answer and `pairsWatch` push the pair got with its freshness, and the backend's recent checks (`diagnostics`, from the deployment's `getDiagnostics`). "Copy diagnostics" copies them as JSON with secret-named keys dropped and credentials in strings replaced. The `diagnostics` query is NOT_FOUND (404) unless `ui.diagnostics` is on, and serves each event's detail made safe for a browser.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Start the first load at once. `startFirstLoad` asks `bootstrap` on every page
  and, on a deep link, the open pair and the slices around it, before the first
  render. The jumps load once per page through the query cache. Plain queries go
  out one request each, so `bootstrap` and the jumps never wait for each other;
  `pair` and `slices` share one streamed batch.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A freshness change reaches the open page: writing an AppEnv's freshness notifies `pairsWatch` like any change, and an App-wide row (`env` `*`) is pushed to each Environment the client watches. So a check that ends clears the line's ring at once instead of at the next refetch; a `reading` the page holds 20 s with no push is asked for again. A failed check may say why: `failed.reason` (`timeout`, `unauthorized`, `unreachable`, `bad-response`) and `failed.message`, which the core stores made safe for a browser (`publicMessage`: first line only, no URLs, hosts, IPs, emails, SQL or secrets, at most 160 characters). The tooltip reads "Couldn't check audit (timed out: …) · showing the value from 41 min ago".

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add subtle group header above Component columns in deployment details dialog. With more than one Component, shows the App display name, component count, and a bracket decoration. With one Component, no header is shown.

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

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Keep the pair cache current: the app subscribes to `pairsWatch` for the slices
  it preloaded plus every pair opened since (through `httpSubscriptionLink`), and
  merges each push into the per-pair cache, so the deployed version line updates
  without a reload.
  A subscription that ends in an error (a proxy answering for a restarting
  server, say) is opened again with a backoff from the last event seen, so the
  server resends what was missed.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Remove the `availabilityMatrix` endpoint, which always returned an empty matrix.

  A company backend no longer implements `getAvailabilityMatrix`, and the
  `AvailabilityMatrixData` and `AvailabilityVariant` types are gone. The frontend
  helpers that read the matrix, `findBestMatchByUrl` and `availabilityMatrixUtils`,
  had no callers and are removed with it. Which Versions run where now comes from
  the deployment facet of `pair` and `slices`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - An app deep link whose slug no jump has asks the backend's rename rules
  (`tryFindRenameRule`) and redirects to the new slug, keeping the environment
  and the value, so links to a renamed app keep working.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - While the backend is being replaced, a 5xx answer that is not the API's own (a load balancer's HTML page) says "env-hopper is restarting Â· retrying" and is retried quietly, instead of showing the raw parse error. The API's fetch (`apiFetch`) turns such an answer into a `ServerRestartingError`; `errorText` and `isServerRestarting` read it.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - - Stored favourites, jump history and the last-used app follow app renames:
  once the apps are known, each stored id no app has is looked up with
  `tryFindRenameRule` and moved to the new name.
  - The deployed-version details list the lead Component first.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The deployed-version details show fields as rows and Components as columns, the main Component first with a `main` tag and its hint. A Version other than the main Component's is highlighted, each Component's Endpoints show as links by host, and past three Components the columns scroll while the row labels stay.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A browser keeps the id the previous UI gave it: `usage.record` takes an optional `legacyUserId`, and a browser with no `eh_uid` cookie is named by it when it is a UUID (else by a new one). The cookie is set by the first `usage.record`, not by any request. Signing in links the browser to the account for good: `EhUser.userId` is set at its first sign-in and never changed; one account may own several browsers. `getUserEvents(since, { userId })` returns a User's history across every browser linked to the same account, and each event names its `ehUserId` and, once linked, its `userId`. The context takes `ehUser: ehUserOf(req, res)`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - What a User does is kept: `usage.record` stores each `open` of an AppEnv and each `jump` from it as a `UserEvent`, under an `EhUser` named by an httpOnly `eh_uid` cookie (and the login, once signed in). The Catalog reads them back with `getUserEvents(since)`. A deployment's backend may implement `warm(appEnvs, reason)`: it is told which AppEnvs someone looks at now, to read what they show again: each `pair` asked for (`view`; the open pair is asked again while it tracks freshness) and each `jump`. The frontend records an `open` when the page shows another AppEnv, and a `jump` when a link is followed. The test kit's mock backend answers `usage.record`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Version line shows its freshness quietly: a Version older than `ui.upToDateFreshnessMs` (default 30 s) greys, a faint ring turns while it is read again, and a check that failed since says "couldn't check"; the tooltip says when it was checked. The pair on screen is read again twice per that interval while its Entity Provider tracks freshness. A "Deployed version" label sits above the line, and a Deploy Attempt is a second line: a progress bar while it runs, then ✓, ✕ or ⊘, with a link to its job. An attempt that succeeds turns green while the Versions swap.

### Patch Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A change request whose title starts with its Work Item shows the key once. Under the previous UI's jump card, the Version slot starts at the card's left edge.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Version line says who deployed it: "· deployed 15 min ago by Jo Doe".

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The star's tooltip starts with what it means: "Not every component of this app runs this version:", then each one that differs. Under the previous UI's jump card, the card's row keeps room below for the Version slot (and its attempt line), so the next section never sits on it.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Version line's tooltip starts with its freshness in plain words: "Up to date · checked 12 s ago", "May be out of date · last confirmed 5 min ago", "May be out of date (last confirmed 5 min ago) · checking audit, gitlab now…", or "Couldn't check audit · showing the value from 41 min ago"; then health and where it was deployed.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - The Version slot sits at the left, under the card's edge, its label above it. A lead Component not deployed on the Environment says "not deployed" with no dot: only a Health problem draws one.

## 2.1.0-alpha-20261014235627

### Patch Changes

- Snapshot release from alpha branch

## 2.1.0-alpha-20261013000513

### Patch Changes

- Snapshot release from alpha branch

## 2.1.0-alpha-20260930195630

### Patch Changes

- [#398](https://github.com/lislon/env-hopper/pull/398) [`ba50bd2`](https://github.com/lislon/env-hopper/commit/ba50bd2da48cd4832b27b6a440b9b831f8dd0755) Thanks [@lislon](https://github.com/lislon)! - Publish with the npm CLI so releases stop silently dropping packages.

  `pnpm changeset publish` reported success for packages that never reached the
  registry. Three releases in a row landed five of six — a different one missing each
  time — while the log listed all six as published, so the only way to notice was to
  query the registry per package afterwards. pnpm 11 regressed its spawned
  `npm publish` path so it no longer reaches npm's OIDC mint.

  Releases now pack with pnpm, which is what resolves `workspace:*` into the tarball,
  and publish each tarball with the npm CLI, which performs the mint and fails per
  package instead of reporting a success it did not achieve. A version already on the
  registry is skipped, so re-running a partially failed release is safe.

  `NPM_TOKEN` is gone from the workflow; trusted publishing covers both paths.

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
