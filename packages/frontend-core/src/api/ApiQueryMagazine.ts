import { queryOptions } from '@tanstack/react-query'
import { indexDataFetcher, queryKey } from './unsorted/indexDataFetcher'
import type { BootstrapConfigData } from '@env-hopper/backend-core'
import type { IndexDataFetcherParams } from './unsorted/indexDataFetcher'

export class ApiQueryMagazine {
  static getConfig(params: IndexDataFetcherParams) {
    const queryFn = indexDataFetcher(params)
    return queryOptions<BootstrapConfigData | undefined, Error>({
      // Same key the fetcher writes its background refresh to, or the refresh
      // lands under a key nothing reads and the client stays a fetch behind.
      queryKey,
      queryFn,
      /*
       * No `staleTime: 0` override. It used to be here, and it meant every
       * component that mounted and asked for the bootstrap started another
       * network fetch — measured twice on a cold production load. It bought
       * nothing: `indexDataFetcher` is already cache-first over IndexedDB and
       * revalidates in the background, so the instant-paint-then-refresh
       * behaviour the override was reaching for is what the fetcher does anyway.
       * The client's default applies instead.
       */
    })
  }
}
