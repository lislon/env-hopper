// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createK8sSource, k8sReadinessChecker } from '../k8sSource'
import { runCheck } from '@env-hopper/backend-core'

const dep = (
  ns: string,
  name: string,
  image: string,
  replicas: number,
  ready: number,
) => ({
  metadata: { namespace: ns, name, labels: { app: name } },
  spec: { replicas, template: { spec: { containers: [{ image }] } } },
  status: { readyReplicas: ready },
})

describe('k8s source', () => {
  it('pages through all namespaces and returns neutral workload records', async () => {
    const pages = [
      {
        items: [dep('a', 'api', 'r.example.com/api:main-1', 2, 2)],
        metadata: { _continue: 'next' },
      },
      {
        items: [dep('b', 'ui', 'r.example.com/ui:main-2', 1, 0)],
        metadata: {},
      },
    ]
    let call = 0
    const src = createK8sSource({
      cluster: 'stage',
      apps: {
        listDeploymentForAllNamespaces: async () => ({ body: pages[call++] }),
      },
      networking: {
        listIngressForAllNamespaces: async () => ({ body: { items: [] } }),
      },
    })
    const out = await src.listWorkloads()
    expect(
      out.map((w) => [w.namespace, w.name, w.images[0]!.tag, w.readyReplicas]),
    ).toEqual([
      ['a', 'api', 'main-1', 2],
      ['b', 'ui', 'main-2', 0],
    ])
  })
  it('readiness maps ready replicas to health', async () => {
    const w = (replicas: number, ready: number) => ({
      workload: {
        cluster: 'c',
        namespace: 'n',
        name: 'x',
        kind: 'Deployment' as const,
        images: [],
        labels: {},
        replicas,
        readyReplicas: ready,
      },
    })
    expect((await runCheck(k8sReadinessChecker, w(2, 2))).state).toBe('healthy')
    expect((await runCheck(k8sReadinessChecker, w(2, 1))).state).toBe(
      'degraded',
    )
    expect((await runCheck(k8sReadinessChecker, w(2, 0))).state).toBe('down')
    expect((await runCheck(k8sReadinessChecker, w(0, 0))).state).toBe('unknown')
  })
})
