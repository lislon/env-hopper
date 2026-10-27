import { queryOptions } from '@tanstack/react-query'
import type {
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '@env-hopper/backend-core'
import type { DbAware } from '~/types/ehTypes'
import type { ResourceJumpHistoryItem } from '../types'
import { resourceJumpsFetcher } from '~/api/unsorted/resourceJumpsFetcher'
import { resourceJumpsExtendedFetcher } from '~/api/unsorted/resourceJumpsExtendedFetcher'

export class ApiQueryMagazineResourceJump {
  static getResourceJumps() {
    const queryFn = resourceJumpsFetcher()
    return queryOptions<ResourceJumpsData | undefined, Error>({
      queryKey: ['resourceJumps'],
      queryFn,
    })
  }

  static getResourceJumpsExtended() {
    const queryFn = resourceJumpsExtendedFetcher()
    return queryOptions<ResourceJumpsExtendedData | undefined, Error>({
      queryKey: ['resourceJumpsExtended'],
      queryFn,
    })
  }

  static getResourceJumpHistory({ db }: DbAware) {
    return queryOptions<Array<ResourceJumpHistoryItem>, Error>({
      queryKey: ['resourceJumpHistory'],
      queryFn: () => db.resourceJumpHistory.toArray(),
    })
  }
}
