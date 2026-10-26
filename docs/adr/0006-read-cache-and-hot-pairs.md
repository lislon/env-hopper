---
status: proposed
---

# Source reads are cached by what they cost, and warmed for the pairs people will open

Reading every Source for every Component on a timer costs the most where it buys the least: most pairs are looked at by nobody, and the most expensive Source is read most often. Use is concentrated and predictable (see [usage patterns](../usage-patterns.md)): a tenth of the users make two thirds of the visits, and 82–94% of what a user opens next is the pair they are on, the Apps used on its Environment, or their own most used pairs.

So every Source read goes through one **Read Cache**, keyed by what the read addresses (a log query for one App, one pipeline by id, a watched namespace). Each entry keeps its value, when it was read, and whether the last refresh failed. How long an entry stays fresh follows the read's cost class: immutable facts (a pipeline's commit) never expire; cheap reads (a database-backed deploy log) are fresh for seconds; streamed reads (a watch) are fresh while the stream is synced; expensive reads (lists from a CI server) are fresh for tens of minutes. A read past its freshness is still served and refreshed in the background; concurrent reads of one key share one call; each Source has a budget, and refreshes queue by priority: a pair on screen, then a pair a user is about to open, then the background scan.

On top of the cache, **Hot Pairs** are the pairs worth keeping warm: for every active visitor, the pair they are on, the Apps used on its Environment and their own most used pairs, and at all times the most used pairs of power users. The core records **usage events** (a visitor opened a pair, or jumped from it) and keeps, per visitor, their most used pairs (at most 200) and whether they are a power user. It tells the Entity Provider which pairs are hot and why; the Entity Provider maps pairs to the reads that serve them and warms those. The background scan becomes a reconciliation every 30–60 minutes that uses the cheapest Sources it can.

A pair's details carry their freshness: when its reads were last confirmed, which reads are under way, and whether the last one failed, so the UI can show up-to-date, stale, checking, pending (and what it is reading), failed, or none.

## Considered Options

- **Poll every Source on a timer** (today). Rejected: the cost follows Apps × Environments × Sources, not use; nobody looking still costs the most.
- **Read the Sources when a pair is opened, no cache.** Rejected: the most expensive reads take minutes, longer than a visit.
- **A cache per Source, each with its own rules.** Rejected: freshness, failure and budgets would be re-solved per Source, and the UI could not say how fresh a pair is.
- **Preload the globally most used pairs.** Rejected: they barely predict what a given user opens next.

## Consequences

- The core keeps visitors (signed in or anonymous), their usage events, their most used pairs and their class; it holds no Source. The Read Cache is a library the Entity Provider uses; which reads serve a pair stays the Entity Provider's (ADR 0001).
- ADR 0004's check of the pair on screen becomes the highest-priority warm request; the Entity Provider still re-decides a pair from everything it knows, never from the one read that just finished.
- An Entity Provider can take shortcuts its Sources allow, such as naming a build from a pipeline id once and caching it forever, without the core knowing.
- Usage events are personal data: they are kept for a bounded time, and anonymous visitors are identified only by a random id.
