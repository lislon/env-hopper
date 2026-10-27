// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  createK8sSource,
  k8sReadinessChecker,
  toWorkloadRecord,
} from '../k8sSource'
import { runCheck } from '@env-hopper/backend-core'

const dep = (
  ns: string,
  name: string,
  image: string,
  replicas: number,
  ready: number,
  annotations: Record<string, string> = {},
) => ({
  metadata: { namespace: ns, name, labels: { app: name }, annotations },
  spec: { replicas, template: { spec: { containers: [{ image }] } } },
  status: { readyReplicas: ready },
})

describe('k8s source', () => {
  it('pages through all namespaces and returns neutral workload records', async () => {
    const pages = [
      {
        items: [
          dep('a', 'api', 'r.example.com/api:main-1', 2, 2, {
            'deploy.id': '42',
          }),
        ],
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
        listNamespacedReplicaSet: async () => ({
          body: { items: [] } as any,
        }),
        listDeploymentForAllNamespaces: async () => ({
          body: pages[call++] as any,
        }),
      },
      networking: {
        listIngressForAllNamespaces: async () => ({
          body: { items: [] } as any,
        }),
      },
    } as any)
    const out = await src.listWorkloads()
    expect(
      out.map((w) => [
        w.namespace,
        w.name,
        w.images[0]!.tag,
        w.readyReplicas,
        w.annotations,
      ]),
    ).toEqual([
      ['a', 'api', 'main-1', 2, { 'deploy.id': '42' }],
      ['b', 'ui', 'main-2', 0, {}],
    ])
  })
  it('a workload carries when its rollout last progressed', () => {
    const at = '2026-10-07T16:11:30Z'
    const progressing = (lastUpdateTime: string | Date) => ({
      ...dep('a', 'api', 'r.example.com/api:main-1', 1, 1),
      status: {
        readyReplicas: 1,
        conditions: [
          { type: 'Available', lastUpdateTime: '2026-01-01T00:00:00Z' },
          { type: 'Progressing', lastUpdateTime },
        ],
      },
    })
    expect(toWorkloadRecord('stage', progressing(at)).rolledOutAt).toBe(
      '2026-10-07T16:11:30.000Z',
    )
    // The client hands a list's times over as Dates.
    expect(
      toWorkloadRecord('stage', progressing(new Date(at))).rolledOutAt,
    ).toBe('2026-10-07T16:11:30.000Z')
    expect(
      toWorkloadRecord('stage', dep('a', 'api', 'x', 1, 1)).rolledOutAt,
    ).toBeUndefined()
  })

  it('throws when exceeding maxPages limit', async () => {
    const src = createK8sSource({
      cluster: 'stage',
      apps: {
        listNamespacedReplicaSet: async () => ({
          body: { items: [] } as any,
        }),
        listDeploymentForAllNamespaces: async () => ({
          body: {
            items: [dep('a', 'x', 'img', 1, 1)],
            metadata: { _continue: 'always' },
          } as any,
        }),
      },
      networking: {
        listIngressForAllNamespaces: async () => ({
          body: { items: [] } as any,
        }),
      },
      maxPages: 2,
    } as any)
    await expect(src.listWorkloads()).rejects.toThrow(
      /exceeded maxPages limit of 2/,
    )
  })
  it('surfaces API errors', async () => {
    const src = createK8sSource({
      cluster: 'stage',
      apps: {
        listNamespacedReplicaSet: async () => ({
          body: { items: [] } as any,
        }),
        listDeploymentForAllNamespaces: async () => {
          throw new Error('API 500')
        },
      },
      networking: {
        listIngressForAllNamespaces: async () => ({
          body: { items: [] } as any,
        }),
      },
    } as any)
    await expect(src.listWorkloads()).rejects.toThrow('API 500')
  })
  it('ingress records include paths and TLS hosts', async () => {
    const src = createK8sSource({
      cluster: 'prod',
      apps: {
        listNamespacedReplicaSet: async () => ({
          body: { items: [] } as any,
        }),
        listDeploymentForAllNamespaces: async () => ({
          body: { items: [] } as any,
        }),
      },
      networking: {
        listIngressForAllNamespaces: async () => ({
          body: {
            items: [
              {
                metadata: { namespace: 'web', name: 'shop' },
                spec: {
                  tls: [{ hosts: ['secure.example.com'] }],
                  rules: [
                    {
                      host: 'secure.example.com',
                      http: {
                        paths: [
                          {
                            path: '/api',
                            backend: { service: { name: 'api-svc' } },
                          },
                          {
                            path: '/web',
                            backend: { service: { name: 'web-svc' } },
                          },
                        ],
                      },
                    },
                    {
                      host: 'plain.example.com',
                      http: {
                        paths: [
                          {
                            path: '/',
                            backend: { service: { name: 'root-svc' } },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          } as any,
        }),
      },
    } as any)
    const out = await src.listIngresses()
    expect(out).toEqual([
      {
        cluster: 'prod',
        namespace: 'web',
        name: 'shop',
        hosts: ['secure.example.com', 'plain.example.com'],
        paths: ['/api', '/web', '/'],
        tlsHosts: ['secure.example.com'],
        backendServices: ['api-svc', 'web-svc', 'root-svc'],
      },
    ])
  })
  it('readiness maps ready replicas to health', async () => {
    const client = {
      readNamespacedDeployment: async (name: string) => ({
        body: dep('n', name, 'img', 2, 2),
      }),
    }
    expect(
      (
        await runCheck(k8sReadinessChecker, {
          cluster: 'c',
          namespace: 'n',
          name: 'healthy',
          apps: client as any,
        })
      ).state,
    ).toBe('healthy')

    const clientDegraded = {
      readNamespacedDeployment: async () => ({
        body: dep('n', 'x', 'img', 2, 1),
      }),
    }
    expect(
      (
        await runCheck(k8sReadinessChecker, {
          cluster: 'c',
          namespace: 'n',
          name: 'x',
          apps: clientDegraded as any,
        })
      ).state,
    ).toBe('degraded')

    const clientDown = {
      readNamespacedDeployment: async () => ({
        body: dep('n', 'x', 'img', 2, 0),
      }),
    }
    expect(
      (
        await runCheck(k8sReadinessChecker, {
          cluster: 'c',
          namespace: 'n',
          name: 'x',
          apps: clientDown as any,
        })
      ).state,
    ).toBe('down')

    const clientScaled = {
      readNamespacedDeployment: async () => ({
        body: dep('n', 'x', 'img', 0, 0),
      }),
    }
    expect(
      (
        await runCheck(k8sReadinessChecker, {
          cluster: 'c',
          namespace: 'n',
          name: 'x',
          apps: clientScaled as any,
        })
      ).state,
    ).toBe('unknown')
  })
  it('readiness checker returns unknown when workload not found', async () => {
    const notFoundError: any = new Error('Not found')
    notFoundError.statusCode = 404
    const client = {
      readNamespacedDeployment: async () => {
        throw notFoundError
      },
    }
    const result = await runCheck(k8sReadinessChecker, {
      cluster: 'c',
      namespace: 'missing',
      name: 'gone',
      apps: client as any,
    })
    expect(result.state).toBe('unknown')
    expect(result.detail).toContain('not found')
  })
  it('readiness checker returns unknown on API error without leaking credentials', async () => {
    const client = {
      readNamespacedDeployment: async () => {
        throw new Error('Unauthorized: invalid token abc123')
      },
    }
    const result = await runCheck(k8sReadinessChecker, {
      cluster: 'c',
      namespace: 'ns',
      name: 'x',
      apps: client as any,
    })
    expect(result.state).toBe('unknown')
    expect(result.detail).toContain('k8s API error')
    expect(result.detail).not.toContain('abc123')
  })
  it('readiness checker honours abort signal timeout', async () => {
    const hangingClient = {
      readNamespacedDeployment: async () => {
        // Never resolves
        return new Promise(() => {})
      },
    }

    const start = Date.now()
    const result = await runCheck(
      k8sReadinessChecker,
      { cluster: 'c', namespace: 'n', name: 'x', apps: hangingClient as any },
      80, // timeout in 80ms
    )
    const elapsed = Date.now() - start

    expect(result.state).toBe('unknown')
    expect(result.detail).toBe('timeout')
    // Check completed promptly (within reasonable margin)
    expect(elapsed).toBeLessThan(150)
  })
})
