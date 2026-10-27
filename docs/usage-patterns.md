# Usage patterns

How people use Env Hopper, measured in one deployment from its last 10,000 jumps (63 days, 390 users, 55 Apps, 212 Environments). A jump is a click that opens a Resource Jump; opening a pair only to read its Version is not in this log, so visits are undercounted. Use these numbers to size caching and preloading; re-measure when the event log has views too.

## Two kinds of user

|                                  | Power users                                          | Regular users |
| -------------------------------- | ---------------------------------------------------- | ------------- |
| Who                              | the top 10% by jumps (more than 68 jumps in 63 days) | everyone else |
| Share of users / of jumps        | 10% / 63%                                            | 90% / 37%     |
| Jumps per user (median)          | 118                                                  | 4             |
| Active days (median, of 63)      | 29                                                   | 2             |
| Visits per active day            | 2.1                                                  | 1.0           |
| Hours between visits (median)    | 4.1                                                  | 25            |
| Pairs / Environments / Apps used | 24 / 8 / 7                                           | 3 / 2 / 2     |

A visit is short for both: one jump at the median, three or four at p90. A visit is a run of jumps less than 30 minutes apart.

## What a user opens next

| A next jump within a visit is…                                                      | Power | Regular |
| ----------------------------------------------------------------------------------- | ----- | ------- |
| the pair they are on                                                                | 27%   | 32%     |
| that pair, or one of their own most used pairs (20 for power users, 10 for regular) | 82%   | 64%     |
| any of those, or an App others used on the same Environment (about 10 more pairs)   | 94%   | 88%     |

- 79% of next jumps within a visit stay on the same Environment.
- 75% of visits start on a pair the user opened before.
- The pairs most used across all users barely predict a new user's first jumps: the top 20 cover 16% of them.
- Use is concentrated: 5% of the pairs ever used hold half of all jumps, and a fifth hold 80%.

## What follows for loading

- On open, load the pair in the URL first, then the Apps used on its Environment, then the user's own most used pairs.
- Power users come back within hours, often before a background refresh: theirs is the stale case worth warming ahead of time.
- A global "popular pairs" list is not worth preloading.

See [personas](personas.md) and [ADR 0006](adr/0006-read-cache-and-hot-pairs.md).
