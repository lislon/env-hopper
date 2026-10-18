---
'@env-hopper/backend-core': minor
---

Pack each `getBootstrapData` object once. A backend that returns the same
object until its data changes, and a new one when it does, now costs one pack
per change instead of one per request. `pair` and `slices` no longer ask for
the bootstrap data at all.
