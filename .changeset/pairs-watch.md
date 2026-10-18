---
'@env-hopper/backend-core': minor
---

Push catalog changes to the browser.

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
