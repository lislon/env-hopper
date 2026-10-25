---
'@env-hopper/source-k8s': minor
---

While a rollout is under way, a workload record says which images its Ready
pods run (`servingImages`): those of the newest older ReplicaSet with Ready
pods, while the Deployment's own ReplicaSet is not fully Ready. The source and
the watcher read ReplicaSets for it; the watcher keeps only those with pods,
and reports a ReplicaSet change as an upsert of its workload when it changes
what serves. A cluster that refuses ReplicaSets (403/404) gives the records as
before. `K8sAppsClient` gains `listReplicaSetForAllNamespaces`.
