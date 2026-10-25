---
'@env-hopper/source-gitlab': minor
---

Each deployment record says when its deploy job started (`startedAt`; the
deployment's own creation when the job has none yet) and links the job itself
(`jobUrl`), so a running, failed or canceled deploy can be shown with its start
and its job.
