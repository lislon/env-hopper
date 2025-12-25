import type { QueryClient, QueryFunctionContext } from '@tanstack/react-query'
import type { Table } from 'dexie'
import { DexieErrorWrapper } from '~/util/error-utils'

/**
 * Error wrapper for TRPC errors to detect network/server errors
 */
export class TRPCErrorWrapper extends Error {
  constructor(originalError: unknown) {
    super('TRPC Error')
    this.name = 'TRPCError'
    this.cause = originalError
  }

  static isNetworkOrServerError(error: unknown): boolean {
    if (!error) return false

    // Check if it's a TRPC error with HTTP status
    const anyError = error as any
    if (anyError?.data?.httpStatus) {
      const status = anyError.data.httpStatus
      // 5xx server errors or specific error codes
      if (status >= 500) return true
    }

    // Check for network-related error messages
    if (typeof anyError?.message === 'string') {
      const msg = anyError.message.toLowerCase()
      if (
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('failed')
      ) {
        return true
      }
    }

    return false
  }
}

export interface CachingFetcherParams<T> {
  cacheKey: string
  networkFetchFn: (ctx: QueryFunctionContext) => Promise<T>
  getDbTable: (ctx: QueryFunctionContext) => Table<T>
  queryKey: ReadonlyArray<unknown>
}

/**
 * Creates a cache-first fetcher that:
 * 1. Checks IndexedDB cache first, returns immediately if found
 * 2. Background sync from network when cache exists
 * 3. Handles errors gracefully - preserves cache on network/server errors
 * 4. Saves fresh data to IndexedDB after successful fetch
 */
export function createCachingFetcher<T>({
  cacheKey,
  networkFetchFn,
  getDbTable,
  queryKey,
}: CachingFetcherParams<T>): (
  ctx: QueryFunctionContext,
) => Promise<T | undefined> {
  return async (ctx: QueryFunctionContext) => {
    // Get queryClient from context
    const queryClient = ctx.client

    // Get dbTable from context
    const dbTable = getDbTable(ctx)

    // Try to get cached data from IndexedDB
    let cached: T | undefined = undefined
    try {
      cached = await dbTable.get(cacheKey)
    } catch (e) {
      console.log(`Error fetching cached data for ${cacheKey}:`, e)
      throw new DexieErrorWrapper(e)
    }


    // If we have cached data, return it immediately and sync in background
    if (cached) {
      void syncFromNetwork(
        {
          networkFetchFn,
          getDbTable,
          cacheKey,
          queryClient,
          queryKey,
        },
        ctx,
      ).catch((error) => {
        // Silently handle background sync errors
        // We already returned cached data, so the user is not affected
        console.debug(`Background sync failed for ${cacheKey}:`, error)
      })
      return cached
    }

    // No cache, fetch from network
    return await syncFromNetwork(
      {
        networkFetchFn,
        getDbTable,
        cacheKey,
        queryClient,
        queryKey,
      },
      ctx,
    )
  }
}

async function syncFromNetwork<T>(
  {
    networkFetchFn,
    getDbTable,
    cacheKey,
    queryClient,
    queryKey,
  }: {
    networkFetchFn: (ctx: QueryFunctionContext) => Promise<T>
    getDbTable: (ctx: QueryFunctionContext) => Table<T>
    cacheKey: string
    queryClient: QueryClient
    queryKey: ReadonlyArray<unknown>
  },
  ctx: QueryFunctionContext,
): Promise<T> {
  try {
    const fresh = await networkFetchFn(ctx)

    // Get dbTable and save to IndexedDB
    const dbTable = getDbTable(ctx)
    await dbTable.put(fresh, cacheKey)

    // Update React Query cache
    queryClient.setQueryData(queryKey, fresh)

    return fresh
  } catch (error) {
    // Check if this is a network or server error
    if (TRPCErrorWrapper.isNetworkOrServerError(error)) {
      // If we have cached data, we should have returned it already
      // This path is only reached if we had no cache and network failed
      // In this case, we should still throw to let React Query handle it
      throw new TRPCErrorWrapper(error)
    }

    // For other errors, re-throw as-is
    throw error
  }
}
