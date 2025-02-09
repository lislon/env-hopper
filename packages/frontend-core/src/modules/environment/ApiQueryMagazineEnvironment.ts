import { queryOptions } from '@tanstack/react-query'
import type { DbAware } from '~/types/ehTypes'
import type { EnvironmentHistoryItem } from './types'

export class ApiQueryMagazineHistory {
  static getEnvSelectionHistory({ db }: DbAware) {
    return queryOptions<Array<EnvironmentHistoryItem>, Error>({
      queryKey: ['envSelectionHistory'],
      queryFn: () => db.environmentHistory.toArray(),
    })
  }
}
