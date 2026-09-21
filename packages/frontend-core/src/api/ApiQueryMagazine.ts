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
      staleTime: 0,
    })
  }
}
