# @env-hopper/test-kit

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
