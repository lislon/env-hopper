---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Two writers of one change write one row. A DeploymentHistory row carries `eventAt`, the Source's time of the change (a deploy's or removed Deployment's `deployedAt`, an attempt's start or end), and is unique by Component, Target, kind, version and `eventAt`; it is inserted with ON CONFLICT DO NOTHING. A removal names the version that went away in `version`. `usage.record` takes the browser's `eventId` (a UUID) and `at` (kept within a day before and 5 minutes after the server's clock); an event sent twice is kept once, and `receivedAt` keeps the server's time.
