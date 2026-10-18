import { httpBatchLink, httpBatchStreamLink, splitLink } from '@trpc/client'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCLink } from '@trpc/client'

/** The queries that answer with a stream of chunks. */
const STREAMED = new Set(['pair', 'slices'])

/**
 * The streamed queries go through `httpBatchStreamLink`, each chunk as it
 * arrives; everything else keeps `link`, so its requests stay as they are.
 */
export function createEhTrpcLinks(
  url: string,
  link: (opts: { url: string }) => TRPCLink<TRPCRouter> = httpBatchLink,
): Array<TRPCLink<TRPCRouter>> {
  return [
    splitLink({
      condition: (op) => STREAMED.has(op.path),
      true: httpBatchStreamLink({ url }),
      false: link({ url }),
    }),
  ]
}
