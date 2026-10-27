# @env-hopper/source-k8s

## 2.2.0

### Patch Changes

- Updated dependencies [[`a5de764`](https://github.com/lislon/env-hopper/commit/a5de76454119799b9317c37fa1eef0e4c105aa50)]:
  - @env-hopper/backend-core@2.2.0

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - While a rollout is under way, a workload record says which images its Ready
  pods run (`servingImages`): those of the newest older ReplicaSet with Ready
  pods, while the Deployment's own ReplicaSet is not fully Ready. Only a
  Deployment mid-rollout has its ReplicaSets read, by its own selector in its
  namespace; the watcher reads them again on each event of that Deployment and
  reports its workload when what serves changes. A refused or failed
  ReplicaSet read gives the record as before and never fails the read of the
  workloads. `K8sAppsClient` gains `listNamespacedReplicaSet`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - `withBearerToken(kc, token)` makes every API call and watch over a KubeConfig
  carry `Authorization: Bearer <token()>`, asked per request, and
  `cachedToken(mint, { refreshBeforeMs })` reuses a minted token until shortly
  before it expires. Together they read a cluster whose tokens are short-lived.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - A workload record carries `rolledOutAt`: when its current rollout last
  progressed, from the Deployment's `Progressing` condition. It is absent when
  the cluster reports no such condition.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add `createK8sWatcher`: Deployments and Ingresses held as trimmed records and
  kept current by one list-then-watch loop per kind, with `snapshot()`,
  `status()` and an `onChange` callback for kept records that changed. An
  expired version (410) relists and reports what changed meanwhile, deletions
  included; other errors reconnect from the last version after a backoff; a
  watchdog replaces a silent stream. `toWorkloadRecord` and `toIngressRecord`
  are exported, and `watchFromKubeConfig` wraps the client's `Watch`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add `@env-hopper/source-k8s`, which reads a Kubernetes cluster for the
  catalog.
  - `createK8sSource()` pages workloads (`listWorkloads`) and ingresses
    (`listIngresses`), with the page size and page count bounded.
  - `k8sReadinessChecker` is a Health Checker over a workload's readiness; a
    workload scaled to zero reads `unknown`.
  - `k8sClientsFromKubeConfig` builds the clients from a kubeconfig, and the
    image-reference helpers parse a workload's image tag.

### Patch Changes

- Updated dependencies [[`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd), [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd)]:
  - @env-hopper/backend-core@2.1.0
