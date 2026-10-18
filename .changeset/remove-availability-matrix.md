---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Remove the `availabilityMatrix` endpoint, which always returned an empty matrix.

A company backend no longer implements `getAvailabilityMatrix`, and the
`AvailabilityMatrixData` and `AvailabilityVariant` types are gone. The frontend
helpers that read the matrix, `findBestMatchByUrl` and `availabilityMatrixUtils`,
had no callers and are removed with it. Which Versions run where now comes from
the deployment facet of `pair` and `slices`.
