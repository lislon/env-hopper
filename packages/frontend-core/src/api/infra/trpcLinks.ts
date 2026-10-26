import {
  httpBatchStreamLink,
  httpLink,
  httpSubscriptionLink,
  splitLink,
} from '@trpc/client'
import type { TRPCRouter } from '@env-hopper/backend-core'
import type { TRPCLink } from '@trpc/client'
import { apiFetch } from '~/util/error-utils'

/** The queries that answer with a stream of chunks. */
const STREAMED = new Set(['pair', 'slices'])

/**
 * Subscriptions (`pairsWatch`) are server-sent events. The streamed queries go
 * through `httpBatchStreamLink`, each chunk as it arrives. Everything else is
 * one request per query: batched, `bootstrap` and `resourceJumps` would each
 * wait for the slower of the two.
 */
export function createEhTrpcLinks(url: string): Array<TRPCLink<TRPCRouter>> {
  return [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({ url }),
      false: splitLink({
        condition: (op) => STREAMED.has(op.path),
        true: httpBatchStreamLink({ url, fetch: apiFetch }),
        false: httpLink({ url, fetch: apiFetch }),
      }),
    }),
  ]
}
