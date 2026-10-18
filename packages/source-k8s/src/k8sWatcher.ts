import { Watch } from '@kubernetes/client-node'
import type { KubeConfig } from '@kubernetes/client-node'
import { toIngressRecord, toWorkloadRecord } from './k8sSource'
import type {
  K8sAppsClient,
  K8sIngressRecord,
  K8sListMeta,
  K8sNetworkingClient,
  K8sWorkloadRecord,
} from './k8sTypes'

/**
 * Opens one watch request: `onEvent` gets each event, `done` the end of the
 * stream (`null` when the server closed it, an error otherwise). The handle
 * aborts it. `watchFromKubeConfig` wraps `@kubernetes/client-node`'s `Watch`.
 */
export type K8sWatchFn = (
  path: string,
  query: Record<string, unknown>,
  onEvent: (type: string, object: unknown) => void,
  done: (err: unknown) => void,
) => Promise<{ abort: () => void }>

export function watchFromKubeConfig(kc: KubeConfig): K8sWatchFn {
  const w = new Watch(kc)
  return async (path, query, onEvent, done) => {
    const req = (await w.watch(path, { ...query }, onEvent, done)) as {
      abort: () => void
      removeAllListeners?: (ev: string) => void
      on?: (ev: string, cb: () => void) => void
    }
    return {
      abort: () => {
        // Errors the aborted request still emits mean nothing.
        req.removeAllListeners?.('error')
        req.on?.('error', () => {})
        req.abort()
      },
    }
  }
}

export type K8sWatchChange =
  | { kind: 'workload'; type: 'upsert' | 'delete'; record: K8sWorkloadRecord }
  | { kind: 'ingress'; type: 'upsert' | 'delete'; record: K8sIngressRecord }

export interface K8sWatcherStatus {
  /** Every kind listed and watching: the snapshot is what the cluster holds. */
  synced: boolean
  /** The last event, bookmark or (re)connect of any kind. */
  lastEventAt?: Date
  /** Lists after the first, each forced by an expired version (410). */
  relists: number
  /** Watches reopened after an error or a silent stream. */
  reconnects: number
  records: { workloads: number; ingresses: number }
}

export interface K8sWatcher {
  start: () => void
  stop: () => void
  snapshot: () => {
    workloads: Array<K8sWorkloadRecord>
    ingresses: Array<K8sIngressRecord>
  }
  status: () => K8sWatcherStatus
}

export interface CreateK8sWatcherOpts {
  cluster: string
  apps: K8sAppsClient
  networking: K8sNetworkingClient
  watch: K8sWatchFn
  /** Which workloads to hold; the others are never kept nor reported. */
  keepWorkload?: (record: K8sWorkloadRecord) => boolean
  keepIngress?: (record: K8sIngressRecord) => boolean
  /** A kept record that changed, appeared or went away; never for the first list. */
  onChange?: (change: K8sWatchChange) => void
  /** A list or watch that failed; the watcher retries on its own. */
  onError?: (error: unknown) => void
  /** How long the server keeps one watch request open. */
  timeoutSeconds?: number
  /** No event or bookmark for this long: the stream is presumed dead. */
  watchdogMs?: number
  pageSize?: number
  /** Retry delays: doubling from `minMs` up to `maxMs`, plus jitter. */
  backoff?: { minMs?: number; maxMs?: number }
}

type Raw = { metadata?: { resourceVersion?: string } }
type ListPage = (
  cont: string | undefined,
  limit: number,
) => Promise<{ body: { items: Array<Raw>; metadata?: K8sListMeta } }>

const statusOf = (err: unknown) => {
  const e = err as { statusCode?: number; code?: unknown } | null
  return e?.statusCode ?? (typeof e?.code === 'number' ? e.code : undefined)
}

/**
 * Holds the cluster's Deployments and Ingresses as trimmed records, kept
 * current by one watch per kind: list (paginated), then watch from the list's
 * resourceVersion.
 *
 * - An expired version (410, in the stream or as its end) relists and reports
 *   what changed meanwhile, deletions included.
 * - Any other error reopens the watch from the last version seen, after a
 *   backoff; so does a stream silent for longer than `watchdogMs`.
 * - A record is reported only when its trimmed form changed: a status update
 *   the record does not carry says nothing.
 *
 * One watcher per process: memory is the kept records only.
 */
export function createK8sWatcher(opts: CreateK8sWatcherOpts): K8sWatcher {
  const {
    cluster,
    timeoutSeconds = 300,
    watchdogMs = 600_000,
    pageSize = 500,
  } = opts
  const minMs = opts.backoff?.minMs ?? 1000
  const maxMs = opts.backoff?.maxMs ?? 60_000
  let stopped = true
  const isStopped = () => stopped
  let lastEventAt: Date | undefined
  let relists = 0
  let reconnects = 0
  const wakers = new Set<() => void>()
  const aborts = new Set<() => void>()

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        wakers.delete(done)
        resolve()
      }
      const timer = setTimeout(done, ms)
      wakers.add(done)
    })

  function kind<TRecord extends K8sWorkloadRecord | K8sIngressRecord>(k: {
    name: K8sWatchChange['kind']
    path: string
    list: ListPage
    toRecord: (raw: never) => TRecord
    keep: (r: TRecord) => boolean
  }) {
    let records = new Map<string, TRecord>()
    let rv = ''
    let synced = false
    const keyOf = (r: TRecord) => `${r.namespace}/${r.name}`
    const emit = (type: 'upsert' | 'delete', record: TRecord) =>
      opts.onChange?.({ kind: k.name, type, record } as K8sWatchChange)

    async function relist() {
      const fresh = new Map<string, TRecord>()
      let cont: string | undefined
      let version = ''
      do {
        let body
        try {
          ;({ body } = await k.list(cont, pageSize))
        } catch (e) {
          // The continue token expired mid-list: start over.
          if (cont && statusOf(e) === 410) {
            fresh.clear()
            cont = undefined
            continue
          }
          throw e
        }
        for (const raw of body.items) {
          const r = k.toRecord(raw as never)
          if (k.keep(r)) fresh.set(keyOf(r), r)
        }
        cont = body.metadata?._continue || undefined
        version = body.metadata?.resourceVersion ?? version
      } while (cont)
      if (synced) {
        for (const [key, r] of records) if (!fresh.has(key)) emit('delete', r)
        for (const [key, r] of fresh) {
          const was = records.get(key)
          if (!was || JSON.stringify(was) !== JSON.stringify(r))
            emit('upsert', r)
        }
      }
      records = fresh
      rv = version
      synced = true
      lastEventAt = new Date()
    }

    /** One watch request, until it ends: how it ended. */
    function watchOnce(): Promise<'closed' | 'gone' | 'error'> {
      return new Promise((resolve) => {
        let settled = false
        let handle: { abort: () => void } | undefined
        let dog: ReturnType<typeof setTimeout> | undefined
        const finish = (how: 'closed' | 'gone' | 'error', err?: unknown) => {
          if (settled) return
          settled = true
          clearTimeout(dog)
          aborts.delete(abort)
          if (how === 'error' && !stopped) opts.onError?.(err)
          handle?.abort()
          resolve(how)
        }
        const abort = () => finish('closed')
        const feed = () => {
          lastEventAt = new Date()
          clearTimeout(dog)
          dog = setTimeout(
            () => finish('error', new Error(`k8s ${k.name} watch silent`)),
            watchdogMs,
          )
        }
        aborts.add(abort)
        feed()
        opts
          .watch(
            k.path,
            { resourceVersion: rv, allowWatchBookmarks: true, timeoutSeconds },
            (type, object) => {
              if (settled) return
              feed()
              const obj = object as Raw & { code?: number }
              if (type === 'ERROR') {
                finish(obj.code === 410 ? 'gone' : 'error', obj)
                return
              }
              const version = obj.metadata?.resourceVersion
              if (
                type === 'ADDED' ||
                type === 'MODIFIED' ||
                type === 'DELETED'
              ) {
                const r = k.toRecord(obj as never)
                const key = keyOf(r)
                const was = records.get(key)
                if (type === 'DELETED' || !k.keep(r)) {
                  if (was) {
                    records.delete(key)
                    emit('delete', was)
                  }
                } else if (!was || JSON.stringify(was) !== JSON.stringify(r)) {
                  records.set(key, r)
                  emit('upsert', r)
                }
              }
              if (version) rv = version
            },
            (err) =>
              err
                ? finish(statusOf(err) === 410 ? 'gone' : 'error', err)
                : finish('closed'),
          )
          .then(
            (h) => {
              handle = h
              if (settled) h.abort()
            },
            (err: unknown) => finish('error', err),
          )
      })
    }

    async function loop() {
      let failures = 0
      while (!stopped) {
        try {
          if (!rv) await relist()
          const how = await watchOnce()
          // `stop()` may have run while it waited.
          if (isStopped()) return
          if (how === 'gone') {
            rv = ''
            relists++
            failures = 0
            continue
          }
          if (how === 'closed') {
            failures = 0
            continue
          }
          reconnects++
        } catch (e) {
          if (isStopped()) return
          opts.onError?.(e)
        }
        failures++
        const delay = Math.min(maxMs, minMs * 2 ** (failures - 1))
        await sleep(delay + Math.random() * minMs)
      }
    }

    return {
      loop,
      records: () => [...records.values()],
      synced: () => synced,
    }
  }

  const workloads = kind<K8sWorkloadRecord>({
    name: 'workload',
    path: '/apis/apps/v1/deployments',
    list: (cont, limit) =>
      opts.apps.listDeploymentForAllNamespaces(
        undefined,
        cont,
        undefined,
        undefined,
        limit,
      ),
    toRecord: (raw) => toWorkloadRecord(cluster, raw),
    keep: opts.keepWorkload ?? (() => true),
  })
  const ingresses = kind<K8sIngressRecord>({
    name: 'ingress',
    path: '/apis/networking.k8s.io/v1/ingresses',
    list: (cont, limit) =>
      opts.networking.listIngressForAllNamespaces(
        undefined,
        cont,
        undefined,
        undefined,
        limit,
      ),
    toRecord: (raw) => toIngressRecord(cluster, raw),
    keep: opts.keepIngress ?? (() => true),
  })

  return {
    start() {
      if (!stopped) return
      stopped = false
      void workloads.loop()
      void ingresses.loop()
    },
    stop() {
      stopped = true
      for (const abort of [...aborts]) abort()
      for (const wake of [...wakers]) wake()
    },
    snapshot: () => ({
      workloads: workloads.records(),
      ingresses: ingresses.records(),
    }),
    status: () => ({
      synced: workloads.synced() && ingresses.synced(),
      lastEventAt,
      relists,
      reconnects,
      records: {
        workloads: workloads.records().length,
        ingresses: ingresses.records().length,
      },
    }),
  }
}
