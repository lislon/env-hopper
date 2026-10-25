// @vitest-environment node
/**
 * The watcher against scripted list pages and watch streams: what the API
 * server would send, one event at a time.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createK8sWatcher } from '../k8sWatcher'
import type { K8sWatchChange, K8sWatchFn, K8sWatcher } from '../k8sWatcher'
import type { RawDeployment, RawIngress, RawReplicaSet } from '../k8sTypes'

const dep = (
  name: string,
  tag: string,
  opts: { rv?: string; ready?: number; ns?: string; extra?: object } = {},
): RawDeployment => ({
  metadata: {
    namespace: opts.ns ?? 'qa',
    name,
    resourceVersion: opts.rv ?? '1',
  },
  spec: {
    replicas: 1,
    template: {
      spec: { containers: [{ image: `r.example.com/${name}:${tag}` }] },
    },
  },
  status: { readyReplicas: opts.ready ?? 1, ...opts.extra },
})

const ing = (name: string, service: string, rv = '1'): RawIngress => ({
  metadata: { namespace: 'qa', name, resourceVersion: rv },
  spec: {
    rules: [
      {
        host: `${name}.example.com`,
        http: {
          paths: [{ path: '/', backend: { service: { name: service } } }],
        },
      },
    ],
  },
})

interface Stream {
  path: string
  query: Record<string, unknown>
  send: (type: string, object: object) => void
  end: (err?: unknown) => void
  aborted: boolean
}

/** A cluster whose list pages and watch streams the test drives. */
function cluster(lists: {
  deployments: Array<
    () => Promise<{ items: Array<RawDeployment>; metadata?: object }>
  >
  ingresses?: Array<
    () => Promise<{ items: Array<RawIngress>; metadata?: object }>
  >
  replicaSets?: Array<
    () => Promise<{ items: Array<RawReplicaSet>; metadata?: object }>
  >
}) {
  const streams: Array<Stream> = []
  const opened: Array<() => void> = []
  let d = 0
  let i = 0
  let rs = 0
  const empty = [
    () => Promise.resolve({ items: [], metadata: { resourceVersion: '1' } }),
  ]
  const watch: K8sWatchFn = (path, query, onEvent, done) => {
    let ended = false
    const s: Stream = {
      path,
      query,
      send: (type, object) => onEvent(type, object),
      end: (err) => {
        if (ended) return
        ended = true
        done(err ?? null)
      },
      aborted: false,
    }
    streams.push(s)
    opened.splice(0).forEach((f) => f())
    return Promise.resolve({
      abort: () => {
        s.aborted = true
        s.end(new Error('aborted'))
      },
    })
  }
  const page = <T>(list: Array<() => Promise<T>>, n: number) =>
    list[Math.min(n, list.length - 1)]!().then((body) => ({ body }))
  return {
    apps: {
      listDeploymentForAllNamespaces: (
        _b?: boolean,
        cont?: string,
      ): Promise<{ body: { items: Array<RawDeployment> } }> =>
        page(lists.deployments, cont ? d++ : ((d = 0), d++)),
      listReplicaSetForAllNamespaces: (
        _b?: boolean,
        cont?: string,
      ): Promise<{ body: { items: Array<RawReplicaSet> } }> =>
        page(lists.replicaSets ?? empty, cont ? rs++ : ((rs = 0), rs++)),
      readNamespacedDeployment: () => Promise.reject(new Error('unused')),
    },
    networking: {
      listIngressForAllNamespaces: (
        _b?: boolean,
        cont?: string,
      ): Promise<{ body: { items: Array<RawIngress> } }> =>
        page(
          lists.ingresses ?? [
            () =>
              Promise.resolve({
                items: [],
                metadata: { resourceVersion: '1' },
              }),
          ],
          cont ? i++ : ((i = 0), i++),
        ),
    },
    watch,
    streams,
    /** The stream of `kind` most recently opened, once it is. */
    async stream(
      kind: 'deployments' | 'ingresses' | 'replicasets',
      nth?: number,
    ) {
      for (;;) {
        const of = streams.filter((s) => s.path.endsWith(kind))
        const s = nth === undefined ? of.at(-1) : of[nth]
        // The nth one as it is; otherwise the newest still open.
        if (s && (nth !== undefined || !s.aborted)) return s
        await new Promise<void>((r) => opened.push(r))
      }
    },
  }
}

const page = (items: Array<RawDeployment>, rv: string, cont?: string) => () =>
  Promise.resolve({ items, metadata: { resourceVersion: rv, _continue: cont } })

let watcher: K8sWatcher | undefined
afterEach(() => watcher?.stop())

function start(
  c: ReturnType<typeof cluster>,
  opts: Partial<Parameters<typeof createK8sWatcher>[0]> = {},
) {
  const changes: Array<K8sWatchChange> = []
  watcher = createK8sWatcher({
    cluster: 'stage',
    apps: c.apps,
    networking: c.networking,
    watch: c.watch,
    onChange: (ch) => changes.push(ch),
    backoff: { minMs: 1, maxMs: 2 },
    ...opts,
  })
  watcher.start()
  return { watcher, changes }
}

const synced = (w: K8sWatcher) => vi.waitUntil(() => w.status().synced)
const tags = (w: K8sWatcher) =>
  w
    .snapshot()
    .workloads.map((r) => `${r.name}:${r.images[0]!.tag}`)
    .sort()

describe('k8s watcher', () => {
  it('lists every page, then watches from the last page’s resourceVersion', async () => {
    const c = cluster({
      deployments: [
        page([dep('api', 'v1')], '5', 'next'),
        page([dep('ui', 'u1')], '7'),
      ],
    })
    const { watcher: w, changes } = start(c)

    await synced(w)
    const s = await c.stream('deployments')

    expect(tags(w)).toEqual(['api:v1', 'ui:u1'])
    expect(s.path).toBe('/apis/apps/v1/deployments')
    expect(s.query).toMatchObject({
      resourceVersion: '7',
      allowWatchBookmarks: true,
      timeoutSeconds: 300,
    })
    expect((await c.stream('ingresses')).path).toBe(
      '/apis/networking.k8s.io/v1/ingresses',
    )
    // The initial list is the starting point, not a change.
    expect(changes).toEqual([])
  })

  it('ADDED, MODIFIED and DELETED update the snapshot and say so', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w, changes } = start(c)
    await synced(w)
    const s = await c.stream('deployments')

    s.send('ADDED', dep('ui', 'u1', { rv: '6' }))
    s.send('MODIFIED', dep('api', 'v2', { rv: '7' }))
    s.send('DELETED', dep('ui', 'u1', { rv: '8' }))

    expect(tags(w)).toEqual(['api:v2'])
    expect(changes.map((ch) => `${ch.type} ${ch.record.name}`)).toEqual([
      'upsert ui',
      'upsert api',
      'delete ui',
    ])
  })

  it('a MODIFIED that changes nothing it keeps says nothing', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w, changes } = start(c)
    await synced(w)
    const s = await c.stream('deployments')

    s.send(
      'MODIFIED',
      dep('api', 'v1', { rv: '6', extra: { observedGeneration: 9 } }),
    )
    s.send('MODIFIED', dep('api', 'v1', { rv: '7', ready: 0 }))

    expect(
      changes.map((ch) => ch.kind === 'workload' && ch.record.readyReplicas),
    ).toEqual([0])
  })

  it('keeps only what `keepWorkload` and `keepIngress` keep', async () => {
    const c = cluster({
      deployments: [page([dep('api', 'v1'), dep('other', 'x')], '5')],
      ingresses: [
        () =>
          Promise.resolve({
            items: [ing('api', 'api'), ing('noise', 'other')],
            metadata: { resourceVersion: '3' },
          }),
      ],
    })
    const { watcher: w, changes } = start(c, {
      keepWorkload: (r) => r.name === 'api',
      keepIngress: (r) => r.backendServices.includes('api'),
    })
    await synced(w)
    const s = await c.stream('deployments')

    s.send('MODIFIED', dep('other', 'y', { rv: '6' }))

    expect(tags(w)).toEqual(['api:v1'])
    expect(w.snapshot().ingresses.map((r) => r.name)).toEqual(['api'])
    expect(w.status().records).toEqual({ workloads: 1, ingresses: 1 })
    expect(changes).toEqual([])
  })

  it('a BOOKMARK moves the version the next watch starts from', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w } = start(c)
    await synced(w)
    const s = await c.stream('deployments', 0)

    s.send('BOOKMARK', { metadata: { resourceVersion: '42' } })
    s.end() // the server's timeoutSeconds ran out

    expect((await c.stream('deployments', 1)).query['resourceVersion']).toBe(
      '42',
    )
    expect(w.status().reconnects).toBe(0)
  })

  it('a 410 in the stream relists, and what the new list lacks is deleted', async () => {
    const c = cluster({
      deployments: [
        page([dep('api', 'v1'), dep('ui', 'u1')], '5'),
        page([dep('api', 'v2')], '9'),
      ],
    })
    let listed = 0
    const apps = {
      ...c.apps,
      listDeploymentForAllNamespaces: (b?: boolean, cont?: string) => {
        listed++
        return c.apps.listDeploymentForAllNamespaces(b, cont)
      },
    }
    const { watcher: w, changes } = start({ ...c, apps })
    await synced(w)
    // The second list call answers with the second page set.
    c.apps.listDeploymentForAllNamespaces = (() => {
      return () => page([dep('api', 'v2')], '9')().then((body) => ({ body }))
    })()
    const s = await c.stream('deployments', 0)

    s.send('ERROR', { kind: 'Status', code: 410, reason: 'Expired' })

    const next = await c.stream('deployments', 1)
    expect(next.query['resourceVersion']).toBe('9')
    expect(tags(w)).toEqual(['api:v2'])
    expect(changes.map((ch) => `${ch.type} ${ch.record.name}`).sort()).toEqual([
      'delete ui',
      'upsert api',
    ])
    expect(w.status().relists).toBe(1)
    expect(listed).toBeGreaterThanOrEqual(1)
  })

  it('a 410 that ends the stream relists too', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w } = start(c)
    await synced(w)
    const s = await c.stream('deployments', 0)

    s.end(Object.assign(new Error('Gone'), { statusCode: 410 }))
    await c.stream('deployments', 1)

    expect(w.status().relists).toBe(1)
  })

  it('any other error reconnects from the last version seen, without a relist', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w } = start(c)
    await synced(w)
    const s = await c.stream('deployments', 0)

    s.send('MODIFIED', dep('api', 'v2', { rv: '6' }))
    s.end(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }))

    expect((await c.stream('deployments', 1)).query['resourceVersion']).toBe(
      '6',
    )
    expect(w.status()).toMatchObject({
      reconnects: 1,
      relists: 0,
      synced: true,
    })
  })

  it('a stream silent for longer than the watchdog allows is replaced', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w } = start(c, { watchdogMs: 30 })
    await synced(w)
    const first = await c.stream('deployments', 0)

    await c.stream('deployments', 1)

    expect(first.aborted).toBe(true)
    expect(w.status().reconnects).toBeGreaterThanOrEqual(1)
  })

  it('a list that fails is retried, and the watcher is not synced until one succeeds', async () => {
    let calls = 0
    const c = cluster({
      deployments: [
        () =>
          calls++ === 0
            ? Promise.reject(
                Object.assign(new Error('Forbidden'), { statusCode: 403 }),
              )
            : page([dep('api', 'v1')], '5')(),
      ],
    })
    const errors: Array<unknown> = []
    const { watcher: w } = start(c, { onError: (e) => errors.push(e) })

    expect(w.status().synced).toBe(false)
    await synced(w)

    expect(tags(w)).toEqual(['api:v1'])
    expect(errors).toHaveLength(1)
  })

  it('stop() aborts the open streams and opens no new one', async () => {
    const c = cluster({ deployments: [page([dep('api', 'v1')], '5')] })
    const { watcher: w } = start(c)
    await synced(w)
    const s = await c.stream('deployments')
    const opened = c.streams.length

    w.stop()
    await new Promise((r) => setTimeout(r, 20))

    expect(s.aborted).toBe(true)
    expect(c.streams.length).toBe(opened)
  })

  describe('mid-rollout', () => {
    /** `shop` at revision 2 wants one pod of main-42. */
    const shop: RawDeployment = {
      metadata: {
        namespace: 'qa',
        name: 'shop',
        resourceVersion: '1',
        annotations: { 'deployment.kubernetes.io/revision': '2' },
      },
      spec: {
        replicas: 1,
        template: {
          spec: { containers: [{ image: 'r.example.com/shop:main-42' }] },
        },
      },
      status: { readyReplicas: 1 },
    }
    const rs = (
      revision: number,
      tag: string,
      ready: number,
      rv = '1',
    ): RawReplicaSet => ({
      metadata: {
        namespace: 'qa',
        name: `shop-r${revision}`,
        resourceVersion: rv,
        annotations: { 'deployment.kubernetes.io/revision': String(revision) },
        ownerReferences: [{ kind: 'Deployment', name: 'shop' }],
      },
      spec: {
        template: {
          spec: { containers: [{ image: `r.example.com/shop:${tag}` }] },
        },
      },
      status: { replicas: 1, readyReplicas: ready },
    })
    const listOf = (items: Array<RawReplicaSet>) => () =>
      Promise.resolve({ items, metadata: { resourceVersion: '5' } })
    const servedBy = (w: K8sWatcher) =>
      w.snapshot().workloads.map((r) => r.servingImages?.[0]?.tag)

    it('the new ReplicaSet turning Ready says the workload changed, once, serving the spec', async () => {
      const c = cluster({
        deployments: [page([shop], '5')],
        replicaSets: [listOf([rs(1, 'main-41', 1), rs(2, 'main-42', 0)])],
      })
      const { watcher: w, changes } = start(c)
      await synced(w)
      const before = servedBy(w)
      const s = await c.stream('replicasets')

      s.send('MODIFIED', rs(2, 'main-42', 1, '6'))

      expect({
        before,
        changes: changes.map((ch) => ({
          kind: ch.kind,
          type: ch.type,
          name: ch.record.name,
          serving: 'servingImages' in ch.record,
        })),
        after: servedBy(w),
      }).toEqual({
        before: ['main-41'],
        changes: [
          { kind: 'workload', type: 'upsert', name: 'shop', serving: false },
        ],
        after: [undefined],
      })
    })

    it('ReplicaSets refused: synced all the same, the spec serves', async () => {
      const c = cluster({
        deployments: [page([shop], '5')],
        replicaSets: [
          () =>
            Promise.reject(
              Object.assign(new Error('forbidden'), { statusCode: 403 }),
            ),
        ],
      })
      const { watcher: w } = start(c, { onError: () => {} })

      await synced(w)

      expect(servedBy(w)).toEqual([undefined])
    })
  })
})
