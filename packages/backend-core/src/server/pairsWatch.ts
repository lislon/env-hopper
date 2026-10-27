import { tracked } from '@trpc/server'
import type { TrackedEnvelope } from '@trpc/server'
import { pairDetails } from './pairDetails'
import { ALL_ENVS } from '../catalog/catalogTypes'
import type { CatalogChange } from '../catalog'
import type { PairChunk } from './pairDetails'
import type { EhTrpcContext } from './ehTrpcContext'

/** What `pairsWatch` watches: the slices a client preloaded, and its pair. */
export interface PairsWatchInput {
  appSlugs?: Array<string>
  envSlugs?: Array<string>
  /** The id of the last event the client saw; tRPC sends it on a reconnect. */
  lastEventId?: string | null
}

async function collect(chunks: AsyncIterable<PairChunk>) {
  const out: Array<PairChunk> = []
  for await (const c of chunks) out.push(c)
  return out
}

/** The catalog's changes from now on, until `signal` aborts. */
async function* changesOf(
  catalog: NonNullable<EhTrpcContext['catalog']>,
  signal: AbortSignal | undefined,
): AsyncGenerator<CatalogChange> {
  const queue: Array<CatalogChange> = []
  let wake: (() => void) | undefined
  const stop = catalog.onChange((change) => {
    queue.push(change)
    wake?.()
  })
  const aborted = () => wake?.()
  signal?.addEventListener('abort', aborted)
  try {
    while (!signal?.aborted) {
      const change = queue.shift()
      if (change) yield change
      else await new Promise<void>((r) => (wake = r))
    }
  } finally {
    stop()
    signal?.removeEventListener('abort', aborted)
  }
}

/**
 * The chunks of the pairs in scope each time a committed write changes them:
 * the same chunks a slice of those pairs would carry, one event per change.
 * In scope: every pair of each `appSlugs` App, and every pair on each
 * `envSlugs` Environment.
 *
 * The first event carries the current change id, so a client that loses the
 * connection can tell where it was. A client back with an older id (it missed
 * changes, or the server restarted) gets its whole scope again first.
 */
export async function* pairsWatch(
  ctx: EhTrpcContext,
  input: PairsWatchInput,
  signal: AbortSignal | undefined,
): AsyncGenerator<TrackedEnvelope<Array<PairChunk>>> {
  const catalog = ctx.catalog
  if (!catalog) return
  const appSlugs = input.appSlugs ?? []
  const envSlugs = input.envSlugs ?? []
  // Listening before anything is read: a change committed meanwhile waits.
  const changes = changesOf(catalog, signal)
  const pending = changes.next()
  const head = catalog.lastChangeId()
  const missed = !!input.lastEventId && input.lastEventId !== head
  yield tracked(
    head,
    missed ? await collect(pairDetails(ctx, { appSlugs, envSlugs })) : [],
  )
  const inScope = (p: CatalogChange['pairs'][number]) =>
    appSlugs.includes(p.app) || envSlugs.includes(p.env)
  // An App-wide change (a freshness for all its Environments) is the pairs
  // of that App on the Environments this client watches.
  const concrete = (p: CatalogChange['pairs'][number]) =>
    p.env === ALL_ENVS ? envSlugs.map((env) => ({ app: p.app, env })) : [p]
  for (let r = await pending; !r.done; r = await changes.next()) {
    const changed = r.value.pairs.flatMap(concrete).filter(inScope)
    if (changed.length === 0) continue
    yield tracked(r.value.id, await collect(pairDetails(ctx, { changed })))
  }
}
