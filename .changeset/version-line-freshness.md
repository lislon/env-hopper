---
'@env-hopper/frontend-core': minor
'@env-hopper/backend-core': minor
---

The Version line shows its freshness quietly: a Version older than `ui.upToDateFreshnessMs` (default 30 s) greys, a faint ring turns while it is read again, and a check that failed since says "couldn't check"; the tooltip says when it was checked. The pair on screen is read again twice per that interval while its Entity Provider tracks freshness. A "Deployed version" label sits above the line, and a Deploy Attempt is a second line: a progress bar while it runs, then ✓, ✕ or ⊘, with a link to its job. An attempt that succeeds turns green while the Versions swap.
