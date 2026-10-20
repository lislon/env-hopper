# @env-hopper/source-k8s

Reads Deployments and Ingresses from a Kubernetes cluster and returns them as
plain records (namespace, name, images, labels, replicas, hosts). It holds no
mapping of its own: which workloads to keep and what they mean to your catalog
are passed in by the caller.

It also ships:

- a watcher that keeps the records current (list, then watch from the list's
  resourceVersion, relisting on 410 and retrying with backoff);
- a readiness health checker for the `@env-hopper/backend-core` Health Check
  runner.

## Install

```bash
npm install @env-hopper/source-k8s @env-hopper/backend-core @kubernetes/client-node@^0.22.3
```

`@env-hopper/backend-core` is a peer dependency, used for the health checker
type. The client functions expect the `@kubernetes/client-node` 0.22 API.

## Usage

```ts
import { KubeConfig } from '@kubernetes/client-node'
import { createK8sSource, createK8sWatcher, k8sClientsFromKubeConfig, watchFromKubeConfig } from '@env-hopper/source-k8s'

const kc = new KubeConfig()
kc.loadFromDefault()
const { apps, networking } = k8sClientsFromKubeConfig(kc)

// One-off read
const source = createK8sSource({ cluster: 'production', apps, networking })
const workloads = await source.listWorkloads()
const ingresses = await source.listIngresses()

// Kept current
const watcher = createK8sWatcher({
  cluster: 'production',
  apps,
  networking,
  watch: watchFromKubeConfig(kc),
  keepWorkload: (w) => w.namespace !== 'kube-system',
  onChange: (change) => console.log(change.kind, change.type, change.record.name),
})
watcher.start()
```

## Health check

```ts
import { runCheck } from '@env-hopper/backend-core'
import { k8sReadinessChecker } from '@env-hopper/source-k8s'

const result = await runCheck(k8sReadinessChecker, {
  cluster: 'production',
  namespace: 'shop',
  name: 'checkout',
  apps, // from k8sClientsFromKubeConfig(kc)
})
```

- `replicas === 0`: `unknown` (scaled down, not broken)
- `readyReplicas === replicas`: `healthy`
- `0 < readyReplicas < replicas`: `degraded`
- `readyReplicas === 0`: `down`

## License

MIT
