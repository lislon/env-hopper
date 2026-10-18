---
'@env-hopper/source-gitlab': minor
---

Add `@env-hopper/source-gitlab`, which reads GitLab environments, deployments
and releases for the catalog. Deployment reads can start from a date, one
environment can be read with its last deployment, and a deployment carries the
deploy pipeline's creation time, the commit time and whether a tag was
deployed. Paging is bounded.
