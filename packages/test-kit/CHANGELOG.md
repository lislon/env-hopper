# @env-hopper/test-kit

## 2.3.0

### Patch Changes

- Updated dependencies [[`8068539`](https://github.com/lislon/env-hopper/commit/80685396aab7b2f67c3356500369425aa418c2e2)]:
  - @env-hopper/backend-core@2.3.0
  - @env-hopper/frontend-core@2.3.0

## 2.2.0

### Patch Changes

- Updated dependencies [[`a5de764`](https://github.com/lislon/env-hopper/commit/a5de76454119799b9317c37fa1eef0e4c105aa50)]:
  - @env-hopper/backend-core@2.2.0
  - @env-hopper/frontend-core@2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A change request is one line: its Work Items, each linked to its page when the bootstrap's `ui.workItemUrl` (a template with `{{key}}`) says where they live, then its title, linked to the change request. Its description is no longer shown. The details dialog has a "Read from" row (the Source each Version came from) and a footer naming each Source the AppEnv is read from and when (`AppEnvFreshness.sources`, a new nullable column). The test kit's fixture takes `ui`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - `FixtureDeployments.changeRequestDescriptions` (by `<componentSlug>/<id>`)
  answers `changeRequestDetails` in the mock backend.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Start the first load at once. `startFirstLoad` asks `bootstrap` on every page
  and, on a deep link, the open pair and the slices around it, before the first
  render. The jumps load once per page through the query cache. Plain queries go
  out one request each, so `bootstrap` and the jumps never wait for each other;
  `pair` and `slices` share one streamed batch.

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

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Remove the `availabilityMatrix` endpoint, which always returned an empty matrix.

  A company backend no longer implements `getAvailabilityMatrix`, and the
  `AvailabilityMatrixData` and `AvailabilityVariant` types are gone. The frontend
  helpers that read the matrix, `findBestMatchByUrl` and `availabilityMatrixUtils`,
  had no callers and are removed with it. Which Versions run where now comes from
  the deployment facet of `pair` and `slices`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A browser keeps the id the previous UI gave it: `usage.record` takes an optional `legacyUserId`, and a browser with no `eh_uid` cookie is named by it when it is a UUID (else by a new one). The cookie is set by the first `usage.record`, not by any request. Signing in links the browser to the account for good: `EhUser.userId` is set at its first sign-in and never changed; one account may own several browsers. `getUserEvents(since, { userId })` returns a User's history across every browser linked to the same account, and each event names its `ehUserId` and, once linked, its `userId`. The context takes `ehUser: ehUserOf(req, res)`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - What a User does is kept: `usage.record` stores each `open` of an AppEnv and each `jump` from it as a `UserEvent`, under an `EhUser` named by an httpOnly `eh_uid` cookie (and the login, once signed in). The Catalog reads them back with `getUserEvents(since)`. A deployment's backend may implement `warm(appEnvs, reason)`: it is told which AppEnvs someone looks at now, to read what they show again: each `pair` asked for (`view`; the open pair is asked again while it tracks freshness) and each `jump`. The frontend records an `open` when the page shows another AppEnv, and a `jump` when a link is followed. The test kit's mock backend answers `usage.record`.

### Patch Changes

- Updated dependencies [[`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd)]:
  - @env-hopper/backend-core@2.1.0
  - @env-hopper/frontend-core@2.1.0

## 2.1.0-alpha-20261014235627

### Patch Changes

- Updated dependencies []:
  - @env-hopper/backend-core@2.1.0-alpha-20261014235627
  - @env-hopper/frontend-core@2.1.0-alpha-20261014235627

## 2.1.0-alpha-20261013000513

### Patch Changes

- Updated dependencies []:
  - @env-hopper/backend-core@2.1.0-alpha-20261013000513
  - @env-hopper/frontend-core@2.1.0-alpha-20261013000513

## 2.1.0-alpha-20260930195630

### Patch Changes

- Updated dependencies [[`ba50bd2`](https://github.com/lislon/env-hopper/commit/ba50bd2da48cd4832b27b6a440b9b831f8dd0755)]:
  - @env-hopper/frontend-core@2.1.0-alpha-20260930195630
  - @env-hopper/backend-core@2.1.0-alpha-20260930195630

## 2.1.0-alpha-20260930191116

### Minor Changes

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

- [#394](https://github.com/lislon/env-hopper/pull/394) [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22) Thanks [@lislon](https://github.com/lislon)! - Add `@env-hopper/test-kit`, an integration test harness that mounts the real app
  against a mock backend and exposes page objects plus cucumber step definitions,
  so behaviour can be pinned down independently of the UI implementing it.
  Downstream suites reuse the steps against their own fixtures via
  `registerCatalog`.

  `frontend-core` gains an `./internal` subpath carrying the pieces the harness
  mounts the app with. It has no stability guarantee and moves in lockstep with the
  test kit.

### Patch Changes

- [#396](https://github.com/lislon/env-hopper/pull/396) [`bae9417`](https://github.com/lislon/env-hopper/commit/bae9417f4136ccfbd9f1602abb3c3335c218d6b5) Thanks [@lislon](https://github.com/lislon)! - Stop a peer-dependent from turning a minor release into a major one.

  `test-kit` peer-depends on the two cores, and changesets escalates a
  peer-dependent to `major` whenever one of its peers takes a `minor` — even when
  the new version still satisfies the declared range. With every package in one
  `fixed` group, that escalation spread to all of them, so seven `minor` changesets
  released as 3.0.0 with nothing having asked for it.

  `onlyUpdatePeerDependentsWhenOutOfRange` limits the escalation to the case it
  exists for: a peer moving outside the range. A release with these same changesets
  now computes 2.1.0.

  A guard runs after `changeset version` on both release paths and fails if any
  package's major went up, so the next one cannot happen quietly. Releasing a major
  on purpose means dispatching the workflow with `allow_major=true`.

- Updated dependencies [[`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`efbbc57`](https://github.com/lislon/env-hopper/commit/efbbc57b56a7f6e36afd5acd404c52532cde8824), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22), [`c76fbd3`](https://github.com/lislon/env-hopper/commit/c76fbd35f8c74da5f134d30bd1893197ec289b22)]:
  - @env-hopper/frontend-core@2.1.0-alpha-20260930191116
  - @env-hopper/backend-core@2.1.0-alpha-20260930191116
