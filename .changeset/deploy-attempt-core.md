---
'@env-hopper/backend-core': minor
---

The catalog stores Deploy Attempts: a deploy run of an Artifact to a Target
that has not succeeded, at most one per (Component, Target), written by the
Entity Provider with `syncDeployAttempts`. A pair's Deployment row carries the
newest attempt on its Environment's Targets as `attempt`, with its Artifact's
aliases, build link and commit, and its starter among the pair's `users`. A
row with no attempt is unchanged. Deleting a Component, Target or Artifact now
reports the pairs whose Deployments or attempts it cascade-deletes.
