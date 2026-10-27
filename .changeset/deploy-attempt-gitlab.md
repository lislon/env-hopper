---
'@env-hopper/source-gitlab': minor
---

Each deployment record says when its deploy job started (`startedAt`, null
when the job never started, as for most canceled runs) and links the job
itself (`jobUrl`), so a running, failed or canceled deploy can be shown with
its start and its job.
