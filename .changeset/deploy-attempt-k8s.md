---
'@env-hopper/source-k8s': minor
---

While a rollout is under way, a workload record says which images its Ready
pods run (`servingImages`): those of the newest older ReplicaSet with Ready
pods, while the Deployment's own ReplicaSet is not fully Ready. Only a
Deployment mid-rollout has its ReplicaSets read, by its own selector in its
namespace; the watcher reads them again on each event of that Deployment and
reports its workload when what serves changes. A refused or failed
ReplicaSet read gives the record as before and never fails the read of the
workloads. `K8sAppsClient` gains `listNamespacedReplicaSet`.
