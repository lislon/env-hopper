---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Stream an App's details on an Environment by facet: `pair` and `slices`.

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
