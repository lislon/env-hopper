import type { HealthChecker } from '@env-hopper/backend-core'
import type { KubeConfig } from '@kubernetes/client-node'
import { AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node'
import type {
  ImageRef,
  K8sAppsClient,
  K8sIngressRecord,
  K8sNetworkingClient,
  K8sReplicaSetRecord,
  K8sSource,
  K8sWorkloadRecord,
  RawDeployment,
  RawIngress,
  RawReplicaSet,
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

const REVISION = 'deployment.kubernetes.io/revision'

const imagesOf = (containers: Array<{ image?: string }> | undefined) =>
  (containers ?? []).map((c) => parseImageRef(c.image ?? ''))

/** A ReplicaSet trimmed to what says which images serve. */
export function toReplicaSetRecord(r: RawReplicaSet): K8sReplicaSetRecord {
  return {
    namespace: r.metadata?.namespace ?? '',
    name: r.metadata?.name ?? '',
    owner:
      r.metadata?.ownerReferences?.find((o) => o.kind === 'Deployment')?.name ??
      '',
    revision: Number(r.metadata?.annotations?.[REVISION] ?? 0) || 0,
    images: imagesOf(r.spec?.template?.spec?.containers),
    replicas: r.status?.replicas ?? 0,
    readyReplicas: r.status?.readyReplicas ?? 0,
  }
}

/**
 * The images the Ready pods run while the Deployment's own ReplicaSet is not
 * fully Ready: those of the highest older revision with Ready pods. Undefined
 * when the spec serves, nothing is wanted, or nothing older is Ready.
 */
export function servingImagesOf(
  w: Pick<K8sWorkloadRecord, 'namespace' | 'name' | 'annotations' | 'replicas'>,
  sets: Array<K8sReplicaSetRecord>,
): Array<ImageRef> | undefined {
  const revision = Number(w.annotations[REVISION] ?? 0) || 0
  if (revision === 0 || w.replicas === 0) return undefined
  const own = sets.filter(
    (s) => s.namespace === w.namespace && s.owner === w.name,
  )
  const current = own.find((s) => s.revision === revision)
  if ((current?.readyReplicas ?? 0) >= w.replicas) return undefined
  return own
    .filter((s) => s.revision < revision && s.readyReplicas > 0)
    .sort((a, b) => b.revision - a.revision)[0]?.images
}

/**
 * A Deployment as the neutral record a Source returns; with its ReplicaSets,
 * the images its Ready pods run mid-rollout.
 */
export function toWorkloadRecord(
  cluster: string,
  d: RawDeployment,
  sets: Array<K8sReplicaSetRecord> = [],
): K8sWorkloadRecord {
  const record: K8sWorkloadRecord = {
    cluster,
    kind: 'Deployment',
    namespace: d.metadata?.namespace ?? '',
    name: d.metadata?.name ?? '',
    labels: d.metadata?.labels ?? {},
    annotations: d.metadata?.annotations ?? {},
    images: imagesOf(d.spec?.template?.spec?.containers),
    replicas: d.spec?.replicas ?? 0,
    readyReplicas: d.status?.readyReplicas ?? 0,
    rolledOutAt: rolloutTime(d),
  }
  const servingImages = servingImagesOf(record, sets)
  return servingImages ? { ...record, servingImages } : record
}

/**
 * A rollout under way: the Deployment wants pods, and not all of them are
 * its current revision's and Ready, or older pods are still there.
 */
export function rollingOut(d: RawDeployment): boolean {
  const want = d.spec?.replicas ?? 0
  const s = d.status ?? {}
  return (
    want > 0 &&
    ((s.updatedReplicas ?? want) < want ||
      (s.readyReplicas ?? 0) < want ||
      (s.replicas ?? want) > want)
  )
}

/**
 * Reads a Deployment's own ReplicaSets with pods, only while it rolls out:
 * otherwise its spec serves and none is read. A refused or failed read
 * (e.g. no permission on ReplicaSets) warns once and reads as none, so the
 * workload shows its spec's images as before; it never fails the k8s read.
 */
export function replicaSetReader(cluster: string, apps: K8sAppsClient) {
  let warned = false
  return async (d: RawDeployment): Promise<Array<K8sReplicaSetRecord>> => {
    const labels = d.spec?.selector?.matchLabels
    const namespace = d.metadata?.namespace
    if (!rollingOut(d) || !labels || !namespace) return []
    const selector = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    try {
      const { body } = await apps.listNamespacedReplicaSet(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        selector,
      )
      return body.items.map(toReplicaSetRecord).filter((r) => r.replicas > 0)
    } catch (e) {
      if (!warned) {
        warned = true
        console.warn(
          `[k8s ${cluster}] ReplicaSets unreadable (${(e as { statusCode?: number }).statusCode ?? 'error'}); workloads show the spec's images only`,
        )
      }
      return []
    }
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
      const read = replicaSetReader(cluster, apps)
      const out: Array<K8sWorkloadRecord> = []
      // ponytail: 10 namespaced reads at a time; only Deployments mid-rollout read any.
      for (let i = 0; i < items.length; i += 10) {
        const part = items.slice(i, i + 10)
        const sets = await Promise.all(part.map((d) => read(d)))
        part.forEach((d, j) => out.push(toWorkloadRecord(cluster, d, sets[j])))
      }
      return out
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
