---
'@env-hopper/frontend-core': patch
'@env-hopper/test-kit': minor
---

Show the running version on a first visit, not only after a reload.

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
