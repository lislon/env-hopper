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
  it('throws when exceeding maxPages limit', async () => {
    const src = createK8sSource({
      cluster: 'stage',
      apps: {
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
    const w = (replicas: number, ready: number) => ({
      workload: {
        cluster: 'c',
        namespace: 'n',
        name: 'x',
        kind: 'Deployment' as const,
        images: [],
        labels: {},
        annotations: {},
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
