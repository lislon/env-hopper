---
status: accepted
---

# The first screen loads from a bootstrap; App and Environment details load in slices

A user who opens Env Hopper, new or returning, should be able to pick any App and any Environment and jump to its current URL right away. So the first request, `bootstrap`, carries exactly what that needs for every App and every Environment: the lists to pick from and what it takes to build each jump URL. It carries nothing else. Everything about one App on one Environment (its links, credentials, deployed Versions, Health, changes and Work Items) is that pair's details, loaded separately. Env Hopper keeps track of the Apps and Environments a user is currently interested in and preloads slices of details around them: for each such Environment, every App on it (a horizontal slice), and for each such App, every Environment it runs on (a vertical slice). A pair outside the preloaded slices is loaded when the user opens it.

## Considered Options

- **One payload with everything** (bootstrap plus every pair's details). Rejected: it grows with Apps × Environments × Components, most of it is never looked at, and it delays the first usable screen for every user.
- **Load each pair's details only when opened, no preload.** Rejected: the pairs a user opens every day, and their neighbours on the same Environment or App, are predictable, so each would pay a round trip it does not need.

## Consequences

- Anything added to `bootstrap` must be needed to pick a pair or to jump to its URL. A feature that needs more data adds to the pair's details, never to `bootstrap`.
- Details are cached per pair on the client, so a pair loaded through any slice is not fetched again when opened.
- Preloading only changes what is fetched early, never what is shown.
- A pair's details come from several sources of different speed, so they are split into facets (links, credentials, deployment, changes, Work Items) and each facet is sent as soon as its source answers, in the same streamed response; the UI shows each facet as it arrives. Changes after that are pushed to the client, not polled.
- A change to the shape of `bootstrap`, the pair details or any new query is agreed with the maintainer before it is built, with example payloads.
