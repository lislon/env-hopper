---
'@env-hopper/frontend-core': patch
'@env-hopper/test-kit': patch
---

"On prod" goes to the newest train production actually runs (by its version, the build its ticket names, or its own release branch), and that train shows as released, even while its ticket still says planned (an ENR left "New" after the deploy). A main-line build on production still counts for the train already released.
