import type { HealthChecker } from '@env-hopper/backend-core'
import type { KubeConfig } from '@kubernetes/client-node'
import { AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node'
import type {
  K8sAppsClient,
  K8sIngressRecord,
  K8sNetworkingClient,
  K8sSource,
  K8sWorkloadRecord,
  RawDeployment,
  RawIngress,
} from './k8sTypes'
import { parseImageRef } from './imageRef'

interface CreateK8sSourceOpts {
  cluster: string
  apps: K8sAppsClient
  networking: K8sNetworkingClient
  pageSize?: number
  maxPages?: number
}

async function listAll<T>(
  resourceName: string,
  fetchPage: (
    cont?: string,
    limit?: number,
  ) => Promise<{
    body: { items: Array<T>; metadata?: { _continue?: string } }
  }>,
  limit: number,
  maxPages: number,
) {
  const out: Array<T> = []
  let cont: string | undefined
  let pageCount = 0
  do {
    pageCount++
    if (pageCount > maxPages) {
      throw new Error(
        `k8s ${resourceName}: exceeded maxPages limit of ${maxPages}`,
      )
    }
    const { body } = await fetchPage(cont, limit)
    out.push(...body.items)
    cont = body.metadata?._continue || undefined
  } while (cont)
  return out
}

/** When the Deployment's current rollout last progressed. */
function rolloutTime(d: RawDeployment): string | undefined {
  const at = d.status?.conditions?.find(
    (c) => c.type === 'Progressing',
  )?.lastUpdateTime
  const ms = at ? new Date(at).getTime() : NaN
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
}

/** A Deployment as the neutral record a Source returns. */
export function toWorkloadRecord(
  cluster: string,
  d: RawDeployment,
): K8sWorkloadRecord {
  return {
    cluster,
    kind: 'Deployment',
    namespace: d.metadata?.namespace ?? '',
    name: d.metadata?.name ?? '',
    labels: d.metadata?.labels ?? {},
    annotations: d.metadata?.annotations ?? {},
    images: (d.spec?.template?.spec?.containers ?? []).map((c) =>
      parseImageRef(c.image ?? ''),
    ),
    replicas: d.spec?.replicas ?? 0,
    readyReplicas: d.status?.readyReplicas ?? 0,
    rolledOutAt: rolloutTime(d),
  }
}

/** An Ingress as the neutral record a Source returns. */
export function toIngressRecord(
  cluster: string,
  i: RawIngress,
): K8sIngressRecord {
  const tlsHosts = new Set<string>()
  for (const tls of i.spec?.tls ?? []) {
    for (const host of tls.hosts ?? []) {
      tlsHosts.add(host)
    }
  }
  const paths = (i.spec?.rules ?? []).flatMap((r) => r.http?.paths ?? [])
  return {
    cluster,
    namespace: i.metadata?.namespace ?? '',
    name: i.metadata?.name ?? '',
    hosts: (i.spec?.rules ?? [])
      .map((r) => r.host)
      .filter((h): h is string => !!h),
    paths: paths.map((p) => p.path).filter((p): p is string => !!p),
    tlsHosts: Array.from(tlsHosts),
    backendServices: paths
      .map((p) => p.backend?.service?.name)
      .filter((s): s is string => !!s),
  }
}

export function createK8sSource({
  cluster,
  apps,
  networking,
  pageSize = 500,
  maxPages = 100,
}: CreateK8sSourceOpts): K8sSource {
  return {
    async listWorkloads() {
      const items = await listAll<RawDeployment>(
        'deployments',
        (cont, limit) =>
          apps.listDeploymentForAllNamespaces(
            undefined,
            cont,
            undefined,
            undefined,
            limit,
          ),
        pageSize,
        maxPages,
      )
      return items.map((d) => toWorkloadRecord(cluster, d))
    },
    async listIngresses() {
      const items = await listAll<RawIngress>(
        'ingresses',
        (cont, limit) =>
          networking.listIngressForAllNamespaces(
            undefined,
            cont,
            undefined,
            undefined,
            limit,
          ),
        pageSize,
        maxPages,
      )
      return items.map((i) => toIngressRecord(cluster, i))
    },
  }
}

export interface K8sReadinessConfig {
  cluster: string
  namespace: string
  name: string
  apps: K8sAppsClient
}

export const k8sReadinessChecker: HealthChecker<K8sReadinessConfig> = {
  name: 'k8s',
  // A slow k8s API says nothing about the workload.
  timeoutState: 'unknown',
  async check({ namespace, name, apps }, signal) {
    let deployment: RawDeployment
    let abortListener: (() => void) | undefined

    try {
      const lookup = apps.readNamespacedDeployment(name, namespace)

      // Race the lookup against the abort signal
      const aborted = new Promise<never>((_, reject) => {
        if (signal.aborted) {
          reject(new Error('timeout'))
        } else {
          abortListener = () => reject(new Error('timeout'))
          signal.addEventListener('abort', abortListener)
        }
      })

      const result = await Promise.race([lookup, aborted])
      deployment = result.body
    } catch (e) {
      if ((e as Error).message === 'timeout' || signal.aborted) {
        return { state: 'unknown', detail: 'timeout' }
      }
      const statusCode = (e as any).statusCode
      if (statusCode === 404) {
        return { state: 'unknown', detail: 'workload not found' }
      }
      return { state: 'unknown', detail: 'k8s API error' }
    } finally {
      if (abortListener) {
        signal.removeEventListener('abort', abortListener)
      }
    }

    const replicas = deployment.spec?.replicas ?? 0
    const readyReplicas = deployment.status?.readyReplicas ?? 0

    if (replicas === 0) return { state: 'unknown', detail: 'scaled to zero' }
    if (readyReplicas >= replicas) return { state: 'healthy' }
    if (readyReplicas > 0)
      return {
        state: 'degraded',
        detail: `${readyReplicas}/${replicas} ready`,
      }
    return { state: 'down', detail: `0/${replicas} ready` }
  },
} satisfies HealthChecker<K8sReadinessConfig>

export function k8sClientsFromKubeConfig(kc: KubeConfig) {
  return {
    apps: kc.makeApiClient(AppsV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  }
}
