import type { HealthChecker } from '@env-hopper/backend-core'
import type { KubeConfig } from '@kubernetes/client-node'
import { AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node'
import type {
  K8sSource,
  K8sWorkloadRecord,
  RawDeployment,
  RawIngress,
} from './k8sTypes'
import { parseImageRef } from './imageRef'

interface CreateK8sSourceOpts {
  cluster: string
  apps: { listDeploymentForAllNamespaces: Function }
  networking: { listIngressForAllNamespaces: Function }
  pageSize?: number
}

async function listAll<T>(
  fetchPage: (
    cont?: string,
    limit?: number,
  ) => Promise<{
    body: { items: Array<T>; metadata?: { _continue?: string } }
  }>,
  limit: number,
) {
  const out: Array<T> = []
  let cont: string | undefined
  do {
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
}: CreateK8sSourceOpts): K8sSource {
  return {
    async listWorkloads() {
      const items = await listAll<RawDeployment>(
        (cont, limit) =>
          apps.listDeploymentForAllNamespaces(
            undefined,
            cont,
            undefined,
            undefined,
            limit,
          ),
        pageSize,
      )
      return items.map((d) => ({
        cluster,
        kind: 'Deployment' as const,
        namespace: d.metadata?.namespace ?? '',
        name: d.metadata?.name ?? '',
        labels: d.metadata?.labels ?? {},
        images: (d.spec?.template?.spec?.containers ?? []).map((c) =>
          parseImageRef(c.image ?? ''),
        ),
        replicas: d.spec?.replicas ?? 0,
        readyReplicas: d.status?.readyReplicas ?? 0,
      }))
    },
    async listIngresses() {
      const items = await listAll<RawIngress>(
        (cont, limit) =>
          networking.listIngressForAllNamespaces(
            undefined,
            cont,
            undefined,
            undefined,
            limit,
          ),
        pageSize,
      )
      return items.map((i) => ({
        cluster,
        namespace: i.metadata?.namespace ?? '',
        name: i.metadata?.name ?? '',
        hosts: (i.spec?.rules ?? [])
          .map((r) => r.host)
          .filter((h): h is string => !!h),
        backendServices: (i.spec?.rules ?? [])
          .flatMap((r) => r.http?.paths ?? [])
          .map((p) => p.backend?.service?.name)
          .filter((s): s is string => !!s),
      }))
    },
  }
}

export const k8sReadinessChecker: HealthChecker<{
  workload: K8sWorkloadRecord
}> = {
  name: 'k8s',
  async check({ workload: { replicas, readyReplicas } }) {
    if (replicas === 0) return { state: 'unknown', detail: 'scaled to zero' }
    if (readyReplicas >= replicas) return { state: 'healthy' }
    if (readyReplicas > 0)
      return { state: 'degraded', detail: `${readyReplicas}/${replicas} ready` }
    return { state: 'down', detail: `0/${replicas} ready` }
  },
}

export function k8sClientsFromKubeConfig(kc: KubeConfig) {
  return {
    apps: kc.makeApiClient(AppsV1Api),
    networking: kc.makeApiClient(NetworkingV1Api),
  }
}
