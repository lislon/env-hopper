import { httpBatchStreamLink, httpLink, splitLink } from '@trpc/client'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCLink } from '@trpc/client'

/** The queries that answer with a stream of chunks. */
const STREAMED = new Set(['pair', 'slices'])

/**
 * The streamed queries go through `httpBatchStreamLink`, each chunk as it
 * arrives. Everything else is one request per query: batched, `bootstrap`
 * and `resourceJumps` would each wait for the slower of the two.
 */
export function createEhTrpcLinks(url: string): Array<TRPCLink<TRPCRouter>> {
  return [
    splitLink({
      condition: (op) => STREAMED.has(op.path),
      true: httpBatchStreamLink({ url }),
      false: httpLink({ url }),
    }),
  ]
}
