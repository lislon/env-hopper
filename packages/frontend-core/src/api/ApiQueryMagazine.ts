import { queryOptions } from '@tanstack/react-query'
import { indexDataFetcher } from './unsorted/indexDataFetcher'
import type { BootstrapConfigData } from '@env-hopper/backend-core'
import type { IndexDataFetcherParams } from './unsorted/indexDataFetcher'

export class ApiQueryMagazine {
  static getConfig(params: IndexDataFetcherParams) {
    const queryFn = indexDataFetcher(params)
    return queryOptions<BootstrapConfigData | undefined, Error>({
      queryKey: ['config'],
      queryFn,
      staleTime: 0,
    })
  }
}
