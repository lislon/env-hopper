---
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Start the first load at once. `startFirstLoad` asks `bootstrap` on every page
and, on a deep link, the open pair and the slices around it, before the first
render. The jumps load once per page through the query cache. Plain queries go
out one request each, so `bootstrap` and the jumps never wait for each other;
`pair` and `slices` share one streamed batch.
