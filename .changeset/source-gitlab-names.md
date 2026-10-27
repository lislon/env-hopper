---
'@env-hopper/source-gitlab': minor
---

Reads for naming builds: a release's own `name`, `searchTags(projectId, search)` (GitLab's `^x` / `x$` search, newest first) and `rawFile(projectId, path, ref)` (a file's text at a ref or commit; null where it does not exist).
