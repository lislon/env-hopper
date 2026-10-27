---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
---

A freshness change reaches the open page: writing an AppEnv's freshness notifies `pairsWatch` like any change, and an App-wide row (`env` `*`) is pushed to each Environment the client watches. So a check that ends clears the line's ring at once instead of at the next refetch; a `reading` the page holds 20 s with no push is asked for again. A failed check may say why: `failed.reason` (`timeout`, `unauthorized`, `unreachable`, `bad-response`) and `failed.message`, which the core stores made safe for a browser (`publicMessage`: first line only, no URLs, hosts, IPs, emails, SQL or secrets, at most 160 characters). The tooltip reads "Couldn't check audit (timed out: …) · showing the value from 41 min ago".
