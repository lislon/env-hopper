---
'@env-hopper/frontend-core': minor
---

Keep the pair cache current: the app subscribes to `pairsWatch` for the slices
it preloaded plus every pair opened since (through `httpSubscriptionLink`), and
merges each push into the per-pair cache, so the deployed version line updates
without a reload.
A subscription that ends in an error (a proxy answering for a restarting
server, say) is opened again with a backoff from the last event seen, so the
server resends what was missed.
