---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Release trains know where their code is: a train's `releaseLine` (its own release or hotfix branch once cut, else the App's main line) and its newest build (`tip`). Builds of that branch count as running the train, whatever version they carry, and each environment says how many commits it is behind the tip, through the optional `getCommitsBehind` backend hook. Hotfixes (`kind: 'hotfix'`, `patches`) are rows of their own; an upcoming one warns while the next train's branch lacks its commits. The card lists environments as a table, "By env" (this one, prod, favourites, recent) or "By build" (freshest first); each environment opens Env Hopper there. Rows tag an upcoming train RC once cut, else with its main line's name; NEXT is gone. While the tab is visible the widget refreshes every 5 minutes. Breaking: `ReleaseTrain.releaseBranch` is replaced by `releaseLine`.
