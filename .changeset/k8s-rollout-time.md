---
'@env-hopper/source-k8s': minor
---

A workload record carries `rolledOutAt`: when its current rollout last
progressed, from the Deployment's `Progressing` condition. It is absent when
the cluster reports no such condition.
