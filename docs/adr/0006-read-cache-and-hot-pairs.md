---
status: proposed
---

# Remembered reads, decided per pair, spent where people look

A person opening a pair wants to see what runs there now, and how sure Env Hopper is about it. The Sources differ widely in cost. Some reads are nearly free and live (a cluster watch), some cheap (a database of deploy records), some expensive (paged lists from a CI server), and some never change once read (what a pipeline built). Use is concentrated and predictable: a tenth of the users make two thirds of the visits, and nearly everything a user opens next is the pair they are on, the Apps used on its Environment, or a pair from their own recent history ([usage patterns](../usage-patterns.md)).

So:

- **Every read is remembered.** The Entity Provider keeps each Source read as a **Fact**: what it said, when it was read, and whether the last attempt to refresh it failed. A Fact is addressed by what the read asks: one App's deploy records, one pipeline, one namespace.
- **Freshness follows cost.** How long a Fact counts as current depends on its read's cost class: never expires (immutable), current while streamed, seconds (cheap), tens of minutes (expensive). An old Fact is still used and is refreshed behind it. Each Source has a budget, spent in priority order: a pair on screen, a pair about to be opened, a frequent user's recent pairs, then the background reconciliation.
- **Decisions are per pair, from Facts.** When a Fact changes, the Entity Provider re-decides only the pairs it serves, from all the Facts of those pairs, never from the one read that just finished. Deciding reads no Source.
- **A pair carries its freshness.** Its details say when its Facts were last confirmed, which are being read, and whether a read failed. The UI shows up-to-date, stale, checking, pending, failed, not deployed, or none.
- **The core knows who looks at what.** It records usage events (a visitor opened a pair, or jumped from it), keeps each visitor's recent pairs and active hours, and tells the Entity Provider which pairs are hot and why. Signed-in and anonymous visitors are both counted; events are kept for a bounded time.

## Considered Options

- **Re-read every Source for every Component on a timer** (today). Rejected: the cost follows Apps × Environments × Sources, not use. A change waits for the slowest read of its Component, and freshness cannot be said per pair.
- **The same runs with a cache in front of the reads.** Rejected as the end state: it cuts the cost, but a refresh still re-decides whole Components, and freshness stays per run.
- **Sources in the core.** Rejected by ADR 0001: costs, shortcuts and conflicts are company-specific.
- **Preload the globally most used pairs.** Rejected: they barely predict what a given user opens next.

## Consequences

- The core gains usage events, visitor history, hot pairs, freshness in pair details, and one call to the company backend ("these pairs are hot, for this reason"). It still holds no Source and no precedence (ADR 0001); bootstrap is unchanged (ADR 0003).
- ADR 0004's check of the pair on screen becomes the highest-priority hot pair.
- An Entity Provider can name builds from facts that never change (a pipeline's branch and commit) and drop reads that only re-derived them.
- The background run becomes a reconciliation of Facts, not the way changes arrive.
