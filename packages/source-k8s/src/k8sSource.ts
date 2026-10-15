import type { HealthChecker } from '@env-hopper/backend-core'
import type { KubeConfig } from '@kubernetes/client-node'
import { AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node'
import type {
  K8sAppsClient,
  K8sNetworkingClient,
  K8sSource,
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
      return items.map((d) => ({
        cluster,
        kind: 'Deployment' as const,
        namespace: d.metadata?.namespace ?? '',
        name: d.metadata?.name ?? '',
        labels: d.metadata?.labels ?? {},
        annotations: d.metadata?.annotations ?? {},
        images: (d.spec?.template?.spec?.containers ?? []).map((c) =>
          parseImageRef(c.image ?? ''),
        ),
        replicas: d.spec?.replicas ?? 0,
        readyReplicas: d.status?.readyReplicas ?? 0,
      }))
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
      return items.map((i) => {
        const tlsHosts = new Set<string>()
        for (const tls of i.spec?.tls ?? []) {
          for (const host of tls.hosts ?? []) {
            tlsHosts.add(host)
          }
        }
        return {
          cluster,
          namespace: i.metadata?.namespace ?? '',
          name: i.metadata?.name ?? '',
          hosts: (i.spec?.rules ?? [])
            .map((r) => r.host)
            .filter((h): h is string => !!h),
          paths: (i.spec?.rules ?? [])
            .flatMap((r) => r.http?.paths ?? [])
            .map((p) => p.path)
            .filter((p): p is string => !!p),
          tlsHosts: Array.from(tlsHosts),
          backendServices: (i.spec?.rules ?? [])
            .flatMap((r) => r.http?.paths ?? [])
            .map((p) => p.backend?.service?.name)
            .filter((s): s is string => !!s),
        }
      })
    },
  }
}

export const k8sReadinessChecker: HealthChecker<{
  cluster: string
  namespace: string
  name: string
  apps: K8sAppsClient
}> = {
  name: 'k8s',
  async check({ namespace, name, apps }) {
    let deployment: RawDeployment
    try {
      const result = await apps.readNamespacedDeployment(name, namespace)
      deployment = result.body
    } catch (e) {
      const statusCode = (e as any).statusCode
      if (statusCode === 404) {
        return { state: 'unknown', detail: 'workload not found' }
      }
      return { state: 'unknown', detail: 'k8s API error' }
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
}

export function k8sClientsFromKubeConfig(kc: KubeConfig) {
  return {
    apps: kc.makeApiClient(AppsV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  }
}
