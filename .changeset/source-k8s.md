---
'@env-hopper/source-k8s': minor
---

Add `@env-hopper/source-k8s`, which reads a Kubernetes cluster for the
catalog.

- `createK8sSource()` pages workloads (`listWorkloads`) and ingresses
  (`listIngresses`), with the page size and page count bounded.
- `k8sReadinessChecker` is a Health Checker over a workload's readiness; a
  workload scaled to zero reads `unknown`.
- `k8sClientsFromKubeConfig` builds the clients from a kubeconfig, and the
  image-reference helpers parse a workload's image tag.
