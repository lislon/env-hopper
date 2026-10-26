---
'@env-hopper/source-gitlab': minor
---

`getPipeline(projectId, id)` describes one pipeline: its ref, commit, whether
the ref is a tag, and what started it (`push`, `api`, `parent_pipeline`, …).
A pipeline never changes, so a caller can keep the answer for good.
