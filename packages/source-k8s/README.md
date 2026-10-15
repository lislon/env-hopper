# @env-hopper/source-k8s

Read workloads and ingresses from a Kubernetes cluster. Provides neutral records that preserve what the Entity Provider needs to identify physical places and artifacts.

## Usage

```ts
import { KubeConfig } from '@kubernetes/client-node'
import { createK8sSource, k8sClientsFromKubeConfig } from '@env-hopper/source-k8s'

const kc = new KubeConfig()
kc.loadFromDefault()
const { apps, networking } = k8sClientsFromKubeConfig(kc)

const source = createK8sSource({
  cluster: 'production',
  apps,
  networking,
})

const workloads = await source.listWorkloads()
const ingresses = await source.listIngresses()
```

## Health Check

Ships a readiness-based health checker that plugs into the core Health Check runner:

```ts
import { runCheck } from '@env-hopper/backend-core'
import { k8sReadinessChecker } from '@env-hopper/source-k8s'

const result = await runCheck(k8sReadinessChecker, { workload })
```

Readiness mapping:

- `replicas === 0` → `unknown` (scaled down, not broken)
- `readyReplicas === replicas` → `healthy`
- `0 < readyReplicas < replicas` → `degraded`
- `readyReplicas === 0` → `down`
